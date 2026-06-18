import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Form,
  Select,
  DatePicker,
  Button,
  Space,
  Radio,
  Input,
  Checkbox,
  Table,
  Tag,
  Descriptions,
  Divider,
  Statistic,
  Typography,
  App,
  Tabs,
  Progress,
  List,
  Alert,
  Modal,
  Tooltip,
  Empty,
  Steps,
  Badge,
  Avatar
} from 'antd';
import {
  ExportOutlined,
  FileSearchOutlined,
  FileProtectOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileZipOutlined,
  SafetyOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PrinterOutlined,
  DownloadOutlined,
  EyeOutlined,
  ReloadOutlined,
  CalendarOutlined,
  TeamOutlined,
  UserOutlined,
  LinkOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { useAuditStore } from '../store/useAuditStore';
import { RiskLevel } from '../types';
import type { ColumnsType } from 'antd/es/table';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const riskLevelColor: Record<RiskLevel, string> = {
  high: 'red',
  medium: 'orange',
  low: 'green'
};
const riskLevelText: Record<RiskLevel, string> = {
  high: '高风险',
  medium: '中风险',
  low: '低风险'
};

export default function EvidenceExport() {
  const { message } = App.useApp();
  const { units, callRecords, riskClues, evidenceChains, unitComplianceMetrics, dailyStats, personnel, matters } = useAuditStore();

  const [generateForm] = Form.useForm();
  const [summary, setSummary] = useState<any>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [contentSections, setContentSections] = useState<string[]>([
    'overview', 'abnormalAnalysis', 'unitAnalysis', 'riskClues', 'evidenceChains', 'suggestions'
  ]);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf' | 'zip'>('excel');
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);

  // 监听表单 format 变化，实时同步到状态（无需重新生成摘要）
  const formatWatch = Form.useWatch('format', generateForm);
  useEffect(() => {
    if (formatWatch && formatWatch !== exportFormat) {
      setExportFormat(formatWatch);
    }
  }, [formatWatch, exportFormat]);

  const generateSummary = (values: any) => {
    const startDate = values.dateRange ? values.dateRange[0].format('YYYY-MM-DD') : '2026-05-01';
    const endDate = values.dateRange ? values.dateRange[1].format('YYYY-MM-DD') : '2026-06-18';
    setDateRange([startDate, endDate]);
    setSelectedUnitIds(values.unitIds || []);
    // 同步输出格式
    if (values.format) {
      setExportFormat(values.format);
    }

    const targetUnitIds = (values.unitIds && values.unitIds.length > 0) ? values.unitIds as string[] : null;
    const targetUnits = targetUnitIds
      ? units.filter(u => targetUnitIds.includes(u.id))
      : units;

    const recordsInRange = callRecords.filter(r => {
      const callDate = r.callTime.split(' ')[0];
      if (callDate < startDate || callDate > endDate) return false;
      if (targetUnitIds && !targetUnitIds.includes(r.unitId)) return false;
      return true;
    });

    const cluesInRange = riskClues.filter(c => {
      const date = c.discoveredTime.split(' ')[0];
      if (date < startDate || date > endDate) return false;
      if (targetUnitIds && !targetUnitIds.includes(c.unitId)) return false;
      return true;
    });

    const chainsInRange = evidenceChains.filter(c => {
      const date = c.startTime.split(' ')[0];
      if (date < startDate || date > endDate) return false;
      if (targetUnitIds && !targetUnitIds.includes(c.unitId)) return false;
      return true;
    });

    const targetPersonnelIds = targetUnitIds
      ? personnel.filter(p => targetUnitIds.includes(p.unitId)).map(p => p.id)
      : null;

    const totalRecords = recordsInRange.length;
    const approvedRecords = recordsInRange.filter(r => r.hasApproval).length;
    const unauthorizedRecords = recordsInRange.filter(r => !r.hasApproval).length;
    const noResultRecords = recordsInRange.filter(r => !r.hasResult).length;
    const authMismatchRecords = recordsInRange.filter(r => r.riskTags.includes('授权时间不匹配')).length;
    const complainedRecords = recordsInRange.filter(r => r.isComplained).length;
    const highRisk = recordsInRange.filter(r => r.riskLevel === 'high').length;
    const mediumRisk = recordsInRange.filter(r => r.riskLevel === 'medium').length;
    const lowRisk = recordsInRange.filter(r => r.riskLevel === 'low').length;

    const unitStats = targetUnits.map(unit => {
      const unitRecords = recordsInRange.filter(r => r.unitId === unit.id);
      const metrics = unitComplianceMetrics.find(m => m.unitId === unit.id);
      return {
        id: unit.id,
        name: unit.name,
        category: unit.category,
        total: unitRecords.length,
        approved: unitRecords.filter(r => r.hasApproval).length,
        noApproval: unitRecords.filter(r => !r.hasApproval).length,
        noResult: unitRecords.filter(r => !r.hasResult).length,
        highRiskCount: unitRecords.filter(r => r.riskLevel === 'high').length,
        abnormalRate: unitRecords.length > 0 ? (unitRecords.filter(r => r.riskTags.length > 0).length / unitRecords.length * 100).toFixed(1) : '0',
        riskScore: metrics?.riskScore || unit.riskScore,
        complianceRate: metrics ? Number(((metrics.approvalRate + metrics.resultRate) / 2).toFixed(1)) : unit.complianceRate,
        complianceLevel: metrics?.complianceLevel || 'fair'
      };
    }).sort((a, b) => Number(b.abnormalRate) - Number(a.abnormalRate));

    const topPersonnel = Object.values(recordsInRange.reduce((acc, r) => {
      if (targetPersonnelIds && !targetPersonnelIds.includes(r.personnelId)) return acc;
      if (!acc[r.personnelId]) {
        acc[r.personnelId] = { id: r.personnelId, name: r.personnelName, unitName: r.unitName, total: 0, abnormal: 0, highRisk: 0, noApproval: 0 };
      }
      acc[r.personnelId].total++;
      if (r.riskTags.length > 0) acc[r.personnelId].abnormal++;
      if (r.riskLevel === 'high') acc[r.personnelId].highRisk++;
      if (!r.hasApproval) acc[r.personnelId].noApproval++;
      return acc;
    }, {} as Record<string, any>))
      .sort((a: any, b: any) => b.abnormal - a.abnormal)
      .slice(0, 10);

    const abnormalTypeStats = [
      { type: '无审批调证', count: unauthorizedRecords, severity: 'high' },
      { type: '调证无办结结果', count: noResultRecords, severity: 'high' },
      { type: '授权时间不匹配', count: authMismatchRecords, severity: 'medium' },
      { type: '高风险行为', count: highRisk, severity: 'high' },
      { type: '关联投诉', count: complainedRecords, severity: 'high' }
    ].sort((a, b) => b.count - a.count);

    const suggestions = [
      {
        title: '加强审批流程管理',
        content: `本期共发现${unauthorizedRecords}条无审批调证记录，建议各单位严格执行"先审批、后调证"制度，强化系统权限校验。`,
        priority: '高'
      },
      {
        title: '强化授权时间校验',
        content: `发现${authMismatchRecords}条授权时间与调用时间不匹配记录，建议优化授权与调用的时间比对机制，增加异常实时告警。`,
        priority: '高'
      },
      {
        title: '提升办件办结效率',
        content: `调证后无办结结果的比例为${totalRecords > 0 ? (noResultRecords / totalRecords * 100).toFixed(1) : 0}%，建议建立调证-办结关联跟踪机制。`,
        priority: '中'
      },
      {
        title: '重点关注高频异常单位',
        content: unitStats.slice(0, 3).map((u, i) => `${i + 1}. ${u.name}（异常率${u.abnormalRate}%）`).join('；'),
        priority: '高'
      },
      {
        title: '开展专项培训',
        content: '建议对异常率较高的单位和工作人员开展电子证照使用规范专项培训，提升合规意识。',
        priority: '中'
      }
    ];

    setSummary({
      reportNo: `SJJL-${dayjs().format('YYYYMMDD')}-${String(Math.floor(Math.random() * 900) + 100)}`,
      generatedTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      auditor: '审计管理员',
      period: `${startDate} 至 ${endDate}`,
      scope: targetUnits.map(u => u.name).join('、'),
      scopeUnits: targetUnits,
      metrics: {
        totalRecords,
        approvedRecords,
        approvalRate: totalRecords > 0 ? (approvedRecords / totalRecords * 100).toFixed(1) : '0',
        unauthorizedRecords,
        noResultRecords,
        noResultRate: totalRecords > 0 ? (noResultRecords / totalRecords * 100).toFixed(1) : '0',
        authMismatchRecords,
        complainedRecords,
        totalClues: cluesInRange.length,
        pendingClues: cluesInRange.filter(c => c.status === 'pending').length,
        investigatingClues: cluesInRange.filter(c => c.status === 'investigating').length,
        verifiedClues: cluesInRange.filter(c => c.status === 'verified').length,
        closedClues: cluesInRange.filter(c => c.status === 'closed').length,
        totalChains: chainsInRange.length,
        completeChains: chainsInRange.filter(c => c.isComplete).length,
        riskyChains: chainsInRange.filter(c => c.riskPoints.length > 0).length,
        highRisk,
        mediumRisk,
        lowRisk
      },
      unitStats,
      topPersonnel,
      abnormalTypeStats,
      relatedClues: cluesInRange,
      relatedChains: chainsInRange,
      suggestions
    });
    // 保存过滤后的调证记录，供ZIP导出使用（严格按所选单位+审计期间）
    setFilteredRecords(recordsInRange);
  };

  const exportColumns: any[] = useMemo(() => {
    if (!summary) return [];
    return summary.unitStats.map((u: any) => ({
      key: u.id,
      name: u.name,
      category: u.category,
      total: u.total,
      approved: u.approved,
      approvalRate: u.total > 0 ? (u.approved / u.total * 100).toFixed(1) + '%' : '0%',
      noApproval: u.noApproval,
      noResult: u.noResult,
      highRisk: u.highRiskCount,
      abnormalRate: u.abnormalRate + '%',
      riskScore: u.riskScore
    }));
  }, [summary]);

  const doExport = async (format: 'excel' | 'pdf' | 'zip') => {
    if (!summary) {
      message.warning('请先生成审计摘要');
      return;
    }
    setExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      if (format === 'excel') {
        // ========== Excel 导出：完整 7 个 Sheet ==========
        const wb = XLSX.utils.book_new();

        const overviewData = [
          ['审计报告摘要'],
          ['报告编号', summary.reportNo],
          ['生成时间', summary.generatedTime],
          ['审计人员', summary.auditor],
          ['审计期间', summary.period],
          ['审计范围', summary.scope],
          [],
          ['核心指标'],
          ['调证总次数', summary.metrics.totalRecords],
          ['有审批调证数', summary.metrics.approvedRecords],
          ['审批合规率', summary.metrics.approvalRate + '%'],
          ['无审批调证数', summary.metrics.unauthorizedRecords],
          ['无办结结果数', summary.metrics.noResultRecords],
          ['无结果率', summary.metrics.noResultRate + '%'],
          ['授权时间不匹配数', summary.metrics.authMismatchRecords],
          ['关联投诉数', summary.metrics.complainedRecords],
          ['风险线索总数', summary.metrics.totalClues],
          ['证据链总数', summary.metrics.totalChains]
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(overviewData), '审计摘要');

        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportColumns), '单位分析');

        const personnelSheet = XLSX.utils.json_to_sheet(summary.topPersonnel.map((p: any) => ({
          '姓名': p.name,
          '所属单位': p.unitName,
          '调证次数': p.total,
          '异常次数': p.abnormal,
          '高风险次数': p.highRisk,
          '无审批次数': p.noApproval
        })));
        XLSX.utils.book_append_sheet(wb, personnelSheet, '人员排行');

        const cluesSheet = XLSX.utils.json_to_sheet(summary.relatedClues.map((c: any) => ({
          '编号': c.clueNo,
          '标题': c.title,
          '类型': c.type,
          '风险等级': riskLevelText[c.riskLevel as RiskLevel],
          '涉及单位': c.unitName,
          '涉及人员': c.personnelName || '',
          '状态': ({ pending: '待核实', investigating: '核查中', verified: '已核实', closed: '已结案' } as Record<string, string>)[c.status],
          '发现时间': c.discoveredTime,
          '发现方式': c.discoveredBy,
          '问责状态': ({ none: '不涉及', pending: '待处理', processing: '处理中', completed: '已完成' } as Record<string, string>)[c.accountabilityStatus]
        })));
        XLSX.utils.book_append_sheet(wb, cluesSheet, '风险线索');

        const abnormalSheet = XLSX.utils.json_to_sheet(summary.abnormalTypeStats.map((a: any) => ({
          '异常类型': a.type,
          '数量': a.count,
          '严重程度': a.severity === 'high' ? '高' : '中'
        })));
        XLSX.utils.book_append_sheet(wb, abnormalSheet, '异常分析');

        const suggestionsSheet = XLSX.utils.json_to_sheet(summary.suggestions.map((s: any, i: number) => ({
          '序号': i + 1,
          '建议标题': s.title,
          '优先级': s.priority,
          '建议内容': s.content
        })));
        XLSX.utils.book_append_sheet(wb, suggestionsSheet, '审计建议');

        XLSX.writeFile(wb, `审计报告_${summary.reportNo}.xlsx`);
        message.success('Excel 报告导出成功');
      } else if (format === 'zip') {
        // ========== ZIP 数据包：完整数据明细 + 证据索引 ==========
        const wb = XLSX.utils.book_new();

        // 1. 数据包说明
        const readme = [
          ['电子证照审计数据包说明'],
          ['生成时间', summary.generatedTime],
          ['审计期间', summary.period],
          ['审计范围', summary.scope],
          ['包含内容：', '调证明细、单位统计、线索清单、证据链索引、人员异常排行'],
          [],
          ['提示', '可作为专项审计取证附件，与PDF报告配套使用']
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(readme), '00_说明');

        // 2. 调证记录明细（严格按选中单位 + 审计期间过滤）
        const zipDetailRecords = filteredRecords.length > 0 ? filteredRecords : callRecords.slice(0, 5000);
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
          zipDetailRecords.slice(0, 5000).map(r => ({
            '记录ID': r.id,
            '调用时间': r.callTime,
            '单位': r.unitName,
            '经办人': r.personnelName,
            '事项': r.matterName,
            '证照类型': r.certType,
            '证照号码': r.certNo,
            '操作': r.operationType,
            '审批状态': r.hasApproval ? '有审批' : '无审批',
            '办结状态': r.hasResult ? (r.resultStatus || '已完成') : '无结果',
            '风险等级': riskLevelText[r.riskLevel],
            '风险标签': r.riskTags.join(','),
            '是否被投诉': r.isComplained ? '是' : '否',
            '来源IP': r.sourceIp
          }))
        ), '01_调证记录明细');

        // 3. 单位合规画像
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary.unitStats.map((u: any) => ({
          '单位名称': u.name,
          '类别': u.category,
          '调证总数': u.total,
          '有审批数': u.approved,
          '无审批数': u.noApproval,
          '无结果数': u.noResult,
          '高风险数': u.highRiskCount,
          '异常率(%)': u.abnormalRate,
          '风险评分': u.riskScore,
          '合规率(%)': u.complianceRate,
          '合规等级': levelText(u.complianceLevel)
        }))), '02_单位合规画像');

        // 4. 线索清单
        const priorityMap: Record<string, string> = { urgent: '紧急', high: '高', normal: '普通', low: '低' };
        const statusMap: Record<string, string> = { pending: '待核实', investigating: '核查中', verified: '已核实', closed: '已结案' };
        const accountabilityMap: Record<string, string> = { none: '不涉及', pending: '待处理', processing: '处理中', completed: '已完成' };
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary.relatedClues.map((c: any) => ({
          '编号': c.clueNo,
          '标题': c.title,
          '类型': c.type,
          '风险等级': riskLevelText[c.riskLevel as RiskLevel],
          '涉及单位': c.unitName,
          '涉及人员': c.personnelName || '',
          '优先级': priorityMap[c.priority] || '',
          '状态': statusMap[c.status] || '',
          '发现时间': c.discoveredTime,
          '问责状态': accountabilityMap[c.accountabilityStatus] || '',
          '线索描述': c.description,
          '关联记录数': c.relatedRecordIds?.length || 0
        }))), '03_风险线索清单');

        // 5. 证据链索引
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary.relatedChains.map((c: any) => ({
          '事务ID': c.transactionId,
          '业务单号': c.businessNo || '',
          '申请人': c.applicantName || '',
          '事项': c.matterName,
          '单位': c.unitName,
          '开始时间': c.startTime,
          '结束时间': c.endTime,
          '总耗时(秒)': c.totalDuration,
          '链路完整性': c.isComplete ? '完整' : '中断',
          '步骤数': c.steps?.length || 0,
          '风险点': c.riskPoints?.join('；') || '',
          '风险点数量': c.riskPoints?.length || 0
        }))), '04_证据链索引');

        // 6. 人员异常排行
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary.topPersonnel.map((p: any, idx: number) => ({
          '排名': idx + 1,
          '姓名': p.name,
          '所属单位': p.unitName,
          '调证次数': p.total,
          '异常次数': p.abnormal,
          '高风险次数': p.highRisk,
          '无审批次数': p.noApproval,
          '异常占比(%)': p.total > 0 ? (p.abnormal / p.total * 100).toFixed(1) : 0
        }))), '05_人员异常排行');

        XLSX.writeFile(wb, `审计数据包_${summary.reportNo}.xlsx`);
        message.success('审计数据包(ZIP逻辑)导出成功，已生成包含6个Sheet的Excel数据包');
      } else {
        // ========== PDF 报告：打开预览并触发打印 ==========
        setPreviewVisible(true);
        setTimeout(() => {
          window.print();
          message.success('PDF报告预览已打开，请使用浏览器打印功能(Ctrl+P)保存为PDF');
        }, 600);
      }

    } catch (e) {
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  // 合规等级工具函数
  function levelText(level: string) {
    return ({ excellent: '优秀', good: '良好', fair: '一般', poor: '较差', critical: '危险' } as Record<string, string>)[level] || level;
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card size="small" title={<Space><ExportOutlined /> 审计摘要生成</Space>}>
        <Form
          form={generateForm}
          layout="vertical"
          onFinish={generateSummary}
          initialValues={{ contentSections }}
        >
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="审计期间" name="dateRange" rules={[{ required: true, message: '请选择时间范围' }]}>
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="审计范围（单位）" name="unitIds" tooltip="留空则包含全部单位">
                <Select
                  mode="multiple"
                  placeholder="选择单位，留空为全部"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  maxTagCount="responsive"
                >
                  {units.map(u => <Option key={u.id} value={u.id} label={u.name}>{u.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="输出格式" name="format" initialValue="excel">
                <Radio.Group>
                  <Radio.Button value="excel"><FileExcelOutlined /> Excel</Radio.Button>
                  <Radio.Button value="pdf"><FilePdfOutlined /> PDF</Radio.Button>
                  <Radio.Button value="zip"><FileZipOutlined /> ZIP</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="报告章节内容">
            <Checkbox.Group
              value={contentSections}
              onChange={v => setContentSections(v as string[])}
              options={[
                { label: '审计概览', value: 'overview' },
                { label: '异常行为分析', value: 'abnormalAnalysis' },
                { label: '单位合规画像', value: 'unitAnalysis' },
                { label: '风险线索明细', value: 'riskClues' },
                { label: '证据链追踪', value: 'evidenceChains' },
                { label: '审计建议', value: 'suggestions' }
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" size="large" icon={<FileSearchOutlined />} htmlType="submit">
                生成审计摘要
              </Button>
              <Button icon={<ReloadOutlined />} size="large" onClick={() => { generateForm.resetFields(); setSummary(null); }}>
                重置
              </Button>
              {summary && (
                <>
                  <Button icon={<EyeOutlined />} size="large" onClick={() => setPreviewVisible(true)}>
                    预览报告
                  </Button>
                  <Button
                    type="primary"
                    danger
                    size="large"
                    icon={<DownloadOutlined />}
                    loading={exporting}
                    onClick={() => doExport(exportFormat)}
                  >
                    导出{exportFormat === 'excel' ? 'Excel' : exportFormat === 'pdf' ? 'PDF' : 'ZIP'}
                  </Button>
                </>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {summary ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card size="small" title={<Space><FileProtectOutlined /> 审计摘要概览</Space>}>
            <Descriptions bordered column={4} size="small">
              <Descriptions.Item label="报告编号">{summary.reportNo}</Descriptions.Item>
              <Descriptions.Item label="生成时间">{summary.generatedTime}</Descriptions.Item>
              <Descriptions.Item label="审计人员">{summary.auditor}</Descriptions.Item>
              <Descriptions.Item label="审计期间">{summary.period}</Descriptions.Item>
              <Descriptions.Item label="审计范围" span={4}>
                {summary.scope}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Row gutter={[16, 16]}>
              <Col xs={12} md={6}>
                <Card size="small" className="stat-card stat-card-blue">
                  <Statistic
                    title={<span style={{ color: '#fff', opacity: 0.9 }}>调证总次数</span>}
                    value={summary.metrics.totalRecords}
                    valueStyle={{ color: '#fff' }}
                    suffix="次"
                  />
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card size="small" className="stat-card stat-card-green">
                  <Statistic
                    title={<span style={{ color: '#fff', opacity: 0.9 }}>审批合规率</span>}
                    value={summary.metrics.approvalRate}
                    valueStyle={{ color: '#fff' }}
                    suffix="%"
                  />
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card size="small" className="stat-card stat-card-red">
                  <Statistic
                    title={<span style={{ color: '#fff', opacity: 0.9 }}>无审批调证</span>}
                    value={summary.metrics.unauthorizedRecords}
                    valueStyle={{ color: '#fff' }}
                    suffix="条"
                  />
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card size="small" className="stat-card stat-card-orange">
                  <Statistic
                    title={<span style={{ color: '#fff', opacity: 0.9 }}>风险线索数</span>}
                    value={summary.metrics.totalClues}
                    valueStyle={{ color: '#fff' }}
                    suffix="件"
                  />
                </Card>
              </Col>
            </Row>
          </Card>

          {contentSections.includes('abnormalAnalysis') && (
            <Card size="small" title={<Space><AlertOutlined style={{ color: '#ff4d4f' }} /> 异常行为分析</Space>}>
              <Row gutter={16}>
                {summary.abnormalTypeStats.map((item: any, idx: number) => (
                  <Col xs={24} md={12} lg={8} key={idx}>
                    <Card
                      size="small"
                      style={{
                        borderLeft: `4px solid ${item.severity === 'high' ? '#ff4d4f' : '#faad14'}`
                      }}
                    >
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space direction="vertical" size={4}>
                          <Tag color={item.severity === 'high' ? 'red' : 'orange'} style={{ margin: 0 }}>
                            {item.severity === 'high' ? '严重' : '中等'}
                          </Tag>
                          <Text strong>{item.type}</Text>
                        </Space>
                        <Text strong style={{ fontSize: 24, color: item.severity === 'high' ? '#ff4d4f' : '#faad14' }}>
                          {item.count}
                        </Text>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>

              <Divider orientation="left">风险等级分布</Divider>
              <Row gutter={16}>
                <Col xs={8}>
                  <Card size="small">
                    <Statistic
                      title={<Space><AlertOutlined style={{ color: '#ff4d4f' }} /> 高风险</Space>}
                      value={summary.metrics.highRisk}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                    <Progress percent={summary.metrics.totalRecords > 0 ? Math.round(summary.metrics.highRisk / summary.metrics.totalRecords * 100) : 0} size="small" strokeColor="#ff4d4f" />
                  </Card>
                </Col>
                <Col xs={8}>
                  <Card size="small">
                    <Statistic
                      title={<Space><SafetyOutlined style={{ color: '#faad14' }} /> 中风险</Space>}
                      value={summary.metrics.mediumRisk}
                      valueStyle={{ color: '#faad14' }}
                    />
                    <Progress percent={summary.metrics.totalRecords > 0 ? Math.round(summary.metrics.mediumRisk / summary.metrics.totalRecords * 100) : 0} size="small" strokeColor="#faad14" />
                  </Card>
                </Col>
                <Col xs={8}>
                  <Card size="small">
                    <Statistic
                      title={<Space><CheckCircleOutlined style={{ color: '#52c41a' }} /> 低风险</Space>}
                      value={summary.metrics.lowRisk}
                      valueStyle={{ color: '#52c41a' }}
                    />
                    <Progress percent={summary.metrics.totalRecords > 0 ? Math.round(summary.metrics.lowRisk / summary.metrics.totalRecords * 100) : 0} size="small" strokeColor="#52c41a" />
                  </Card>
                </Col>
              </Row>

              <Divider orientation="left">异常人员 TOP10</Divider>
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                dataSource={summary.topPersonnel}
                columns={[
                  { title: '排名', key: 'rank', width: 60, render: (_, __, i) => <Tag color={i < 3 ? 'red' : i < 6 ? 'orange' : 'default'}>{i + 1}</Tag> },
                  { title: '姓名', dataIndex: 'name', width: 100 },
                  { title: '所属单位', dataIndex: 'unitName', ellipsis: true },
                  { title: '调证次数', dataIndex: 'total', width: 100 },
                  { title: '异常次数', dataIndex: 'abnormal', width: 100, render: v => <Text strong style={{ color: '#ff4d4f' }}>{v}</Text> },
                  { title: '高风险', dataIndex: 'highRisk', width: 100, render: v => v > 0 ? <Tag color="red">{v}</Tag> : '-' },
                  { title: '无审批', dataIndex: 'noApproval', width: 100, render: v => v > 0 ? <Tag color="orange">{v}</Tag> : '-' }
                ]}
              />
            </Card>
          )}

          {contentSections.includes('unitAnalysis') && (
            <Card size="small" title={<Space><TeamOutlined style={{ color: '#1677ff' }} /> 单位合规画像分析</Space>}>
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                dataSource={summary.unitStats}
                scroll={{ x: 1000 }}
                columns={[
                  { title: '排名', key: 'rank', width: 60, render: (_, __, i) => <Tag color={i < 3 ? 'red' : i < 6 ? 'orange' : 'default'}>{i + 1}</Tag> },
                  { title: '单位名称', dataIndex: 'name', width: 220, ellipsis: true },
                  { title: '类别', dataIndex: 'category', width: 100 },
                  { title: '调证总数', dataIndex: 'total', width: 100 },
                  { title: '有审批', dataIndex: 'approved', width: 100 },
                  { title: '无审批', dataIndex: 'noApproval', width: 100, render: v => <span style={{ color: '#ff4d4f' }}>{v}</span> },
                  { title: '无结果', dataIndex: 'noResult', width: 100, render: v => <span style={{ color: '#faad14' }}>{v}</span> },
                  { title: '高风险', dataIndex: 'highRiskCount', width: 100, render: v => v > 0 ? <Tag color="red">{v}</Tag> : '-' },
                  { title: '异常率', key: 'rate', width: 130, render: (_, r: any) => <Progress percent={Number(r.abnormalRate)} size="small" strokeColor="#ff4d4f" format={(p: number | undefined) => `${p ?? 0}%`} /> },
                  { title: '风险评分', dataIndex: 'riskScore', width: 100, render: v => <Text strong style={{ color: v >= 70 ? '#ff4d4f' : v >= 50 ? '#faad14' : '#52c41a' }}>{v}</Text> }
                ]}
              />
            </Card>
          )}

          {contentSections.includes('riskClues') && (
            <Card size="small" title={<Space><AlertOutlined style={{ color: '#ff4d4f' }} /> 风险线索明细 ({summary.relatedClues.length} 件)</Space>}>
              <Table
                size="small"
                rowKey="id"
                pagination={{ pageSize: 5 }}
                dataSource={summary.relatedClues}
                columns={[
                  { title: '编号', dataIndex: 'clueNo', width: 140 },
                  { title: '标题', dataIndex: 'title', width: 280, ellipsis: true },
                  { title: '类型', dataIndex: 'type', width: 140, render: v => <Tag color="purple">{v}</Tag> },
                  { title: '风险等级', dataIndex: 'riskLevel', width: 100, render: (v: RiskLevel) => <Tag color={riskLevelColor[v]}>{riskLevelText[v]}</Tag> },
                  { title: '涉及单位', dataIndex: 'unitName', width: 180, ellipsis: true },
                  { title: '涉及人员', dataIndex: 'personnelName', width: 100, render: v => v || '-' },
                  {
                    title: '状态', dataIndex: 'status', width: 100,
                    render: v => <Tag color={
                      v === 'pending' ? 'default' : v === 'investigating' ? 'processing' : v === 'verified' ? 'success' : 'warning'
                    }>
                      {v === 'pending' ? '待核实' : v === 'investigating' ? '核查中' : v === 'verified' ? '已核实' : '已结案'}
                    </Tag>
                  },
                  { title: '发现时间', dataIndex: 'discoveredTime', width: 180 }
                ]}
              />
            </Card>
          )}

          {contentSections.includes('evidenceChains') && (
            <Card size="small" title={<Space><LinkOutlined /> 证据链追踪 ({summary.relatedChains.length} 条)</Space>}>
              <List
                dataSource={summary.relatedChains}
                renderItem={(chain: any) => (
                  <List.Item>
                    <Card size="small" style={{ width: '100%' }}>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }} align="start">
                        <Space direction="vertical" size={4}>
                          <Space>
                            <Text code>{chain.transactionId}</Text>
                            {chain.businessNo && <Tag color="blue">{chain.businessNo}</Tag>}
                            {chain.isComplete ? <Tag color="green">完整链路</Tag> : <Tag color="orange">链路中断</Tag>}
                            {chain.riskPoints.length > 0 && <Badge count={chain.riskPoints.length}><Tag color="red">含风险</Tag></Badge>}
                          </Space>
                          <Space size={8}>
                            <Tag color="purple">{chain.matterName}</Tag>
                            <Tag>{chain.unitName}</Tag>
                            {chain.applicantName && <Tag color="cyan">申请人：{chain.applicantName}</Tag>}
                          </Space>
                          <Text type="secondary">{chain.startTime} ~ {chain.endTime}（{Math.floor(chain.totalDuration / 60)}分{chain.totalDuration % 60}秒）</Text>
                          {chain.riskPoints.length > 0 && (
                            <Alert type="error" showIcon message={<Space>{chain.riskPoints.map((r: string, i: number) => <Tag key={i} color="red">{r}</Tag>)}</Space>} style={{ marginTop: 4 }} />
                          )}
                        </Space>
                        <Tag color="geekblue">{chain.steps.length} 个步骤</Tag>
                      </Space>
                    </Card>
                  </List.Item>
                )}
              />
            </Card>
          )}

          {contentSections.includes('suggestions') && (
            <Card size="small" title={<Space><SafetyOutlined style={{ color: '#52c41a' }} /> 审计建议</Space>}>
              <Steps
                direction="vertical"
                current={summary.suggestions.length}
                items={summary.suggestions.map((s: any) => ({
                  title: (
                    <Space>
                      <Text strong>{s.title}</Text>
                      <Tag color={s.priority === '高' ? 'red' : 'orange'} style={{ margin: 0 }}>优先级：{s.priority}</Tag>
                    </Space>
                  ),
                  description: <Paragraph style={{ marginBottom: 0 }}>{s.content}</Paragraph>,
                  status: 'process' as const
                }))}
              />
            </Card>
          )}
        </Space>
      ) : (
        <Card size="small" style={{ textAlign: 'center' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" size={8}>
                <Text type="secondary">请先选择审计期间和范围</Text>
                <Text type="secondary">点击「生成审计摘要」查看报告</Text>
              </Space>
            }
          >
            <Button type="primary" icon={<FileSearchOutlined />} onClick={() => generateForm.submit()}>立即生成</Button>
          </Empty>
        </Card>
      )}

      <Modal
        title={
          <Space>
            <PrinterOutlined />
            审计报告预览
            {summary && <Text type="secondary">{summary.reportNo}</Text>}
          </Space>
        }
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={960}
        footer={
          <Space>
            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>打印</Button>
            <Button icon={<DownloadOutlined />} onClick={() => { doExport('pdf'); setPreviewVisible(false); }}>导出PDF</Button>
            <Button type="primary" onClick={() => setPreviewVisible(false)}>关闭</Button>
          </Space>
        }
      >
        {summary && (
          <div style={{ padding: 16, background: '#fff' }}>
            <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '2px solid #1677ff', paddingBottom: 16 }}>
              <Title level={2} style={{ marginBottom: 8 }}>电子证照用证审计报告</Title>
              <Space direction="vertical" size={4}>
                <Text type="secondary">报告编号：{summary.reportNo}</Text>
                <Text type="secondary">审计期间：{summary.period}</Text>
                <Text type="secondary">生成时间：{summary.generatedTime}</Text>
              </Space>
            </div>

            <Descriptions title="一、审计概览" column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="审计范围">{summary.scope}</Descriptions.Item>
              <Descriptions.Item label="审计人员">{summary.auditor}</Descriptions.Item>
              <Descriptions.Item label="调证总次数">{summary.metrics.totalRecords} 次</Descriptions.Item>
              <Descriptions.Item label="审批合规率">{summary.metrics.approvalRate}%</Descriptions.Item>
              <Descriptions.Item label="无审批调证">{summary.metrics.unauthorizedRecords} 条</Descriptions.Item>
              <Descriptions.Item label="关联投诉">{summary.metrics.complainedRecords} 件</Descriptions.Item>
              <Descriptions.Item label="风险线索">{summary.metrics.totalClues} 件</Descriptions.Item>
              <Descriptions.Item label="证据链路">{summary.metrics.totalChains} 条</Descriptions.Item>
            </Descriptions>

            <Title level={4} style={{ marginTop: 16 }}>二、主要发现</Title>
            {summary.abnormalTypeStats.map((item: any, i: number) => (
              <Alert
                key={i}
                type={item.severity === 'high' ? 'error' : 'warning'}
                showIcon
                style={{ marginBottom: 8 }}
                message={`${i + 1}. ${item.type}：${item.count} 起`}
              />
            ))}

            <Title level={4} style={{ marginTop: 16 }}>三、审计建议</Title>
            <List
              dataSource={summary.suggestions}
              renderItem={(item: any, i) => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <Space style={{ marginBottom: 4 }}>
                      <Tag color={item.priority === '高' ? 'red' : 'orange'}>建议 {i + 1}</Tag>
                      <Text strong>{item.title}</Text>
                    </Space>
                    <Paragraph style={{ marginBottom: 0 }}>{item.content}</Paragraph>
                  </div>
                </List.Item>
              )}
            />

            <div style={{ marginTop: 32, textAlign: 'right', borderTop: '1px dashed #ddd', paddingTop: 16 }}>
              <Text>审计人员签字：______________</Text>
              <Divider type="vertical" />
              <Text>日期：{dayjs().format('YYYY年MM月DD日')}</Text>
            </div>
          </div>
        )}
      </Modal>
    </Space>
  );
}
