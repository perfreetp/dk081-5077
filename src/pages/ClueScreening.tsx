import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Form,
  Select,
  DatePicker,
  Button,
  Space,
  Table,
  Tag,
  Checkbox,
  Drawer,
  Descriptions,
  Statistic,
  Divider,
  Modal,
  Input,
  Radio,
  App,
  Typography,
  Progress,
  List,
  Badge,
  Tooltip
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  EyeOutlined,
  PlusOutlined,
  WarningOutlined,
  AlertOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  FileProtectOutlined
} from '@ant-design/icons';
import { useAuditStore } from '../store/useAuditStore';
import { CallRecord, RiskLevel } from '../types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text, Title } = Typography;
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

const operationTypeText: Record<string, string> = {
  query: '查询',
  download: '下载',
  verify: '核验',
  share: '共享'
};

const resultStatusText: Record<string, { text: string; color: string }> = {
  completed: { text: '已办结', color: 'green' },
  processing: { text: '办理中', color: 'blue' },
  rejected: { text: '已驳回', color: 'red' },
  pending: { text: '无结果', color: 'default' }
};

export default function ClueScreening() {
  const { message, modal } = App.useApp();
  const {
    units,
    personnel,
    matters,
    certTypes,
    callRecords,
    filters,
    setFilters,
    resetFilters,
    filteredCallRecords,
    addRiskClue
  } = useAuditStore();

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<CallRecord | null>(null);
  const [registerVisible, setRegisterVisible] = useState(false);
  const [registerForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState<'all' | 'abnormal'>('all');

  const abnormalTagPool = [
    { tag: '无审批调证', icon: <AlertOutlined />, color: 'red', desc: '调用记录无对应审批流程' },
    { tag: '授权时间不匹配', icon: <ClockCircleOutlined />, color: 'orange', desc: '调用时间超出授权有效期' },
    { tag: '高频查询', icon: <ThunderboltOutlined />, color: 'orange', desc: '单人均日查询超过阈值' },
    { tag: '短时多次查询', icon: <ClockCircleOutlined />, color: 'red', desc: '短时间内同一证照被多次查询' },
    { tag: '多部门交叉查询', icon: <TeamOutlined />, color: 'purple', desc: '同一证照被多个部门连续查询' },
    { tag: '查看无结果', icon: <FileProtectOutlined />, color: 'gold', desc: '调证后无对应办结记录' },
    { tag: '非正常工作时间', icon: <ClockCircleOutlined />, color: 'cyan', desc: '00:00-06:00或22:00-24:00调证' },
    { tag: '异地IP访问', icon: <WarningOutlined />, color: 'blue', desc: '非常用IP段访问' }
  ];

  const abnormalAnalysis = useMemo(() => {
    const abnormalList = callRecords.filter(r => r.riskTags.length > 0);

    const unitAbnormal: Record<string, { name: string; total: number; noApproval: number; noResult: number; highFreq: number; crossDept: number }> = {};
    callRecords.forEach(r => {
      if (!unitAbnormal[r.unitId]) {
        unitAbnormal[r.unitId] = { name: r.unitName, total: 0, noApproval: 0, noResult: 0, highFreq: 0, crossDept: 0 };
      }
      unitAbnormal[r.unitId].total++;
      if (!r.hasApproval) unitAbnormal[r.unitId].noApproval++;
      if (!r.hasResult) unitAbnormal[r.unitId].noResult++;
      if (r.riskTags.includes('高频查询') || r.riskTags.includes('短时多次查询')) unitAbnormal[r.unitId].highFreq++;
      if (r.riskTags.includes('多部门交叉查询')) unitAbnormal[r.unitId].crossDept++;
    });

    const topUnitList = Object.values(unitAbnormal)
      .sort((a, b) => (b.noApproval + b.noResult) - (a.noApproval + a.noResult))
      .slice(0, 6);

    const personnelAbnormal: Record<string, { name: string; unit: string; total: number; abnormal: number }> = {};
    abnormalList.forEach(r => {
      if (!personnelAbnormal[r.personnelId]) {
        personnelAbnormal[r.personnelId] = { name: r.personnelName, unit: r.unitName, total: 0, abnormal: 0 };
      }
      personnelAbnormal[r.personnelId].total++;
      personnelAbnormal[r.personnelId].abnormal++;
    });
    const topPersonnel = Object.values(personnelAbnormal).sort((a, b) => b.abnormal - a.abnormal).slice(0, 5);

    const sameCertMultiDept = callRecords.reduce((acc, r) => {
      const key = r.certNo;
      if (!acc[key]) acc[key] = { certNo: r.certNo, certType: r.certType, depts: new Set<string>(), calls: 0, times: [] as string[] };
      acc[key].depts.add(r.unitName);
      acc[key].calls++;
      acc[key].times.push(r.callTime);
      return acc;
    }, {} as Record<string, { certNo: string; certType: string; depts: Set<string>; calls: number; times: string[] }>);
    const multiDeptCertList = Object.values(sameCertMultiDept)
      .filter(x => x.depts.size >= 2)
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 5)
      .map(x => ({ ...x, deptCount: x.depts.size, depts: Array.from(x.depts) }));

    const highFreqNoResult = Object.values(callRecords.reduce((acc, r) => {
      const key = r.personnelId;
      if (!acc[key]) {
        acc[key] = { id: key, name: r.personnelName, unit: r.unitName, total: 0, noResult: 0, certTypes: new Set<string>() };
      }
      acc[key].total++;
      if (!r.hasResult) acc[key].noResult++;
      acc[key].certTypes.add(r.certType);
      return acc;
    }, {} as Record<string, { id: string; name: string; unit: string; total: number; noResult: number; certTypes: Set<string> }>))
      .filter(x => x.total >= 50 && x.noResult / x.total >= 0.4)
      .sort((a, b) => (b.noResult / b.total) - (a.noResult / a.total))
      .slice(0, 5)
      .map(x => ({ ...x, noResultRate: (x.noResult / x.total * 100).toFixed(1), certTypes: Array.from(x.certTypes) }));

    return {
      abnormalList,
      topUnitList,
      topPersonnel,
      multiDeptCertList,
      highFreqNoResult,
      noApprovalCount: callRecords.filter(r => !r.hasApproval).length,
      noResultCount: callRecords.filter(r => !r.hasResult).length,
      authMismatchCount: callRecords.filter(r => r.riskTags.includes('授权时间不匹配')).length,
      complainedCount: callRecords.filter(r => r.isComplained).length
    };
  }, [callRecords]);

  const displayRecords = activeTab === 'all' ? filteredCallRecords : filteredCallRecords.filter(r => r.riskTags.length > 0);

  const columns: ColumnsType<CallRecord> = [
    { title: '调用时间', dataIndex: 'callTime', key: 'callTime', width: 180, fixed: 'left', sorter: (a, b) => new Date(b.callTime).getTime() - new Date(a.callTime).getTime() },
    { title: '风险等级', dataIndex: 'riskLevel', key: 'riskLevel', width: 100, render: (level: RiskLevel) => (
      <Badge color={riskLevelColor[level]} text={<span style={{ fontWeight: 600 }}>{riskLevelText[level]}</span>} />
    )},
    { title: '单位', dataIndex: 'unitName', key: 'unitName', width: 200, ellipsis: true },
    { title: '经办人', dataIndex: 'personnelName', key: 'personnelName', width: 100 },
    { title: '事项', dataIndex: 'matterName', key: 'matterName', width: 180, ellipsis: true },
    { title: '证照类型', dataIndex: 'certType', key: 'certType', width: 120 },
    { title: '证照号码', dataIndex: 'certNo', key: 'certNo', width: 180, render: v => v.slice(0, 6) + '****' + v.slice(-4) },
    { title: '操作类型', dataIndex: 'operationType', key: 'operationType', width: 90, render: v => <Tag color="blue">{operationTypeText[v]}</Tag> },
    { title: '审批状态', key: 'approval', width: 100, render: (_, r) => r.hasApproval ? <Tag color="green">有审批</Tag> : <Tag color="red">无审批</Tag> },
    { title: '办结状态', key: 'result', width: 100, render: (_, r) => {
      if (!r.hasResult) return <Tag color="gold">无结果</Tag>;
      const s = resultStatusText[r.resultStatus || 'completed'];
      return <Tag color={s.color}>{s.text}</Tag>;
    }},
    { title: '投诉', key: 'complain', width: 80, render: (_, r) => r.isComplained ? <Tag color="red">被投诉</Tag> : '-' },
    { title: '风险标签', key: 'risks', width: 240, render: (_, r) => (
      <Space size={[4, 4]} wrap>
        {r.riskTags.map(tag => {
          const info = abnormalTagPool.find(t => t.tag === tag);
          return <Tag key={tag} color={info?.color || 'default'} icon={info?.icon}>{tag}</Tag>;
        })}
      </Space>
    )},
    { title: '操作', key: 'action', width: 120, fixed: 'right', render: (_, r) => (
      <Space size="small">
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setCurrentRecord(r); setDetailVisible(true); }}>详情</Button>
        <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => { setCurrentRecord(r); registerForm.setFieldsValue({ relatedRecordIds: [r.id], unitId: r.unitId, unitName: r.unitName, personnelId: r.personnelId, personnelName: r.personnelName }); setRegisterVisible(true); }}>立项</Button>
      </Space>
    )}
  ];

  const handleRegisterClue = async (values: any) => {
    try {
      addRiskClue({
        clueNo: `XZ-${dayjs().format('YYYY-MM')}-${String(Math.floor(Math.random() * 900) + 100)}`,
        title: values.title,
        type: values.type,
        description: values.description,
        riskLevel: values.riskLevel,
        unitId: values.unitId,
        unitName: units.find(u => u.id === values.unitId)?.name || values.unitName,
        personnelId: values.personnelId,
        personnelName: personnel.find(p => p.id === values.personnelId)?.name || values.personnelName,
        relatedRecordIds: values.relatedRecordIds || [currentRecord?.id].filter(Boolean) as string[],
        discoveredTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        discoveredBy: '人工登记',
        status: 'pending',
        priority: values.priority,
        accountabilityStatus: 'none',
        tags: values.tags || []
      });
      message.success('线索登记成功');
      setRegisterVisible(false);
      registerForm.resetFields();
    } catch (e) {
      message.error('登记失败');
    }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" className="stat-card stat-card-red">
            <Statistic
              title={<span style={{ color: '#fff', opacity: 0.9 }}>无审批调证</span>}
              value={abnormalAnalysis.noApprovalCount}
              valueStyle={{ color: '#fff' }}
              prefix={<AlertOutlined />}
              suffix="条"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" className="stat-card stat-card-orange">
            <Statistic
              title={<span style={{ color: '#fff', opacity: 0.9 }}>调证无结果</span>}
              value={abnormalAnalysis.noResultCount}
              valueStyle={{ color: '#fff' }}
              prefix={<FileProtectOutlined />}
              suffix="条"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" className="stat-card" style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
            <Statistic
              title={<span style={{ opacity: 0.9 }}>授权时间不匹配</span>}
              value={abnormalAnalysis.authMismatchCount}
              prefix={<ClockCircleOutlined />}
              suffix="条"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" className="stat-card stat-card-blue">
            <Statistic
              title={<span style={{ color: '#fff', opacity: 0.9 }}>投诉关联记录</span>}
              value={abnormalAnalysis.complainedCount}
              valueStyle={{ color: '#fff' }}
              prefix={<SafetyOutlined />}
              suffix="条"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={
              <Space>
                <TeamOutlined style={{ color: '#ff4d4f' }} />
                多部门短时连续查询同一证照（TOP5）
              </Space>
            }
            extra={<Tag color="red">重点关注</Tag>}
          >
            <List
              size="small"
              dataSource={abnormalAnalysis.multiDeptCertList}
              locale={{ emptyText: '暂未发现此类异常' }}
              renderItem={(item, idx) => (
                <List.Item>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }} align="start">
                    <Space direction="vertical" size={2}>
                      <Space>
                        <Tag color="red">#{idx + 1}</Tag>
                        <Text strong>{item.certType}</Text>
                        <Text type="secondary" copyable>{item.certNo.slice(0, 6)}****{item.certNo.slice(-4)}</Text>
                      </Space>
                      <Space size={[4, 4]} wrap>
                        {item.depts.map(d => <Tag key={d} color="purple">{d}</Tag>)}
                      </Space>
                    </Space>
                    <Space direction="vertical" size={2} align="end">
                      <Text strong style={{ color: '#ff4d4f' }}>{item.deptCount}个部门</Text>
                      <Text type="secondary">共查询{item.calls}次</Text>
                    </Space>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={
              <Space>
                <ThunderboltOutlined style={{ color: '#faad14' }} />
                高频查看但少有办结（TOP5）
              </Space>
            }
            extra={<Tag color="orange">待核查</Tag>}
          >
            <List
              size="small"
              dataSource={abnormalAnalysis.highFreqNoResult}
              locale={{ emptyText: '暂未发现此类异常' }}
              renderItem={(item, idx) => (
                <List.Item>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }} align="start">
                    <Space direction="vertical" size={2}>
                      <Space>
                        <Tag color="orange">#{idx + 1}</Tag>
                        <Text strong>{item.name}</Text>
                        <Text type="secondary">{item.unit}</Text>
                      </Space>
                      <Space size={[4, 4]} wrap>
                        {item.certTypes.slice(0, 3).map(c => <Tag key={c} color="cyan">{c}</Tag>)}
                        {item.certTypes.length > 3 && <Tag>+{item.certTypes.length - 3}</Tag>}
                      </Space>
                    </Space>
                    <Space direction="vertical" size={2} align="end">
                      <Progress percent={Number(item.noResultRate)} size="small" strokeColor="#ff4d4f" style={{ width: 120 }} />
                      <Text type="secondary">{item.noResult}/{item.total}条无结果</Text>
                    </Space>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card size="small">
        <Form layout="inline" style={{ rowGap: 12 }} onValuesChange={(changed) => {
          const mapped: any = {};
          if (changed.dateRange) mapped.dateRange = changed.dateRange ? [changed.dateRange[0].format('YYYY-MM-DD'), changed.dateRange[1].format('YYYY-MM-DD')] : null;
          Object.assign(mapped, changed);
          setFilters(mapped);
        }}>
          <Form.Item label="单位" name="unitIds">
            <Select mode="multiple" placeholder="请选择" allowClear style={{ minWidth: 200 }} maxTagCount="responsive" showSearch optionFilterProp="label">
              {units.map(u => <Option key={u.id} value={u.id} label={u.name}>{u.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="事项" name="matterIds">
            <Select mode="multiple" placeholder="请选择" allowClear style={{ minWidth: 200 }} maxTagCount="responsive" showSearch optionFilterProp="label">
              {matters.map(m => <Option key={m.id} value={m.id} label={m.name}>{m.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="人员" name="personnelIds">
            <Select mode="multiple" placeholder="请选择" allowClear style={{ minWidth: 160 }} maxTagCount="responsive" showSearch optionFilterProp="label">
              {personnel.map(p => <Option key={p.id} value={p.id} label={p.name}>{p.name} - {p.unitName}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="证照类型" name="certTypes">
            <Select mode="multiple" placeholder="请选择" allowClear style={{ minWidth: 160 }} maxTagCount="responsive">
              {certTypes.map(c => <Option key={c} value={c}>{c}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="风险等级" name="riskLevels">
            <Select mode="multiple" placeholder="请选择" allowClear style={{ minWidth: 140 }}>
              <Option value="high">高风险</Option>
              <Option value="medium">中风险</Option>
              <Option value="low">低风险</Option>
            </Select>
          </Form.Item>
          <Form.Item label="调用时间" name="dateRange">
            <RangePicker format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item label="审批状态" name="hasApproval">
            <Select placeholder="全部" allowClear style={{ width: 120 }}>
              <Option value={true}>有审批</Option>
              <Option value={false}>无审批</Option>
            </Select>
          </Form.Item>
          <Form.Item label="办结状态" name="hasResult">
            <Select placeholder="全部" allowClear style={{ width: 120 }}>
              <Option value={true}>有结果</Option>
              <Option value={false}>无结果</Option>
            </Select>
          </Form.Item>
          <Form.Item label="关联投诉" name="isComplained">
            <Select placeholder="全部" allowClear style={{ width: 120 }}>
              <Option value={true}>被投诉</Option>
              <Option value={false}>未被投诉</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={resetFilters}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        size="small"
        title={
          <Space>
            <FilterOutlined />
            调证记录
            <Radio.Group
              size="small"
              value={activeTab}
              onChange={e => setActiveTab(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="all">全部 ({filteredCallRecords.length})</Radio.Button>
              <Radio.Button value="abnormal">异常 ({filteredCallRecords.filter(r => r.riskTags.length > 0).length})</Radio.Button>
            </Radio.Group>
          </Space>
        }
        extra={
          <Space>
            <Tag color="blue">当前显示 {displayRecords.length} 条</Tag>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setCurrentRecord(null); setRegisterVisible(true); }}>登记线索</Button>
          </Space>
        }
      >
        <Table<CallRecord>
          size="small"
          rowKey="id"
          columns={columns}
          dataSource={displayRecords}
          scroll={{ x: 1800 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条记录`,
            pageSize: 10
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            preserveSelectedRowKeys: true
          }}
        />
      </Card>

      <Drawer
        title={
          <Space>
            <EyeOutlined />
            调证记录详情
          </Space>
        }
        width={720}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        extra={
          <Space>
            <Button icon={<PlusOutlined />} type="primary" onClick={() => {
              if (currentRecord) {
                registerForm.setFieldsValue({ relatedRecordIds: [currentRecord.id], unitId: currentRecord.unitId, unitName: currentRecord.unitName, personnelId: currentRecord.personnelId, personnelName: currentRecord.personnelName });
                setRegisterVisible(true);
              }
            }}>登记线索</Button>
          </Space>
        }
      >
        {currentRecord && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Space size={[8, 8]} wrap>
              <Badge color={riskLevelColor[currentRecord.riskLevel]} text={<Tag color={riskLevelColor[currentRecord.riskLevel]} style={{ margin: 0 }}>{riskLevelText[currentRecord.riskLevel]}</Tag>} />
              {currentRecord.riskTags.map(t => {
                const info = abnormalTagPool.find(x => x.tag === t);
                return <Tag key={t} color={info?.color} icon={info?.icon}>{t}</Tag>;
              })}
              {currentRecord.isComplained && <Tag color="red">被投诉</Tag>}
            </Space>

            <Descriptions title="基本信息" bordered column={2} size="small">
              <Descriptions.Item label="记录ID">{currentRecord.id}</Descriptions.Item>
              <Descriptions.Item label="事务ID">{currentRecord.transactionId}</Descriptions.Item>
              <Descriptions.Item label="调用时间" span={2}>{currentRecord.callTime}</Descriptions.Item>
              <Descriptions.Item label="调用单位">{currentRecord.unitName}</Descriptions.Item>
              <Descriptions.Item label="经办人">{currentRecord.personnelName}</Descriptions.Item>
              <Descriptions.Item label="办理事项" span={2}>{currentRecord.matterName}</Descriptions.Item>
              <Descriptions.Item label="操作类型">{operationTypeText[currentRecord.operationType]}</Descriptions.Item>
              <Descriptions.Item label="来源IP">{currentRecord.sourceIp}</Descriptions.Item>
              <Descriptions.Item label="设备信息" span={2}>{currentRecord.deviceInfo}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="证照信息" bordered column={2} size="small">
              <Descriptions.Item label="证照类型">{currentRecord.certType}</Descriptions.Item>
              <Descriptions.Item label="证照号码"><Text copyable>{currentRecord.certNo}</Text></Descriptions.Item>
              <Descriptions.Item label="持有人" span={2}>{currentRecord.holderName}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="审批与授权" bordered column={2} size="small">
              <Descriptions.Item label="审批状态">
                {currentRecord.hasApproval ? <Tag color="green">已审批</Tag> : <Tag color="red">未审批</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="审批编号">{currentRecord.approvalId || '-'}</Descriptions.Item>
              <Descriptions.Item label="授权编号">{currentRecord.authorizationId || '-'}</Descriptions.Item>
              <Descriptions.Item label="授权有效期">
                {currentRecord.authorizationTime && currentRecord.authorizationExpireTime
                  ? `${currentRecord.authorizationTime} ~ ${currentRecord.authorizationExpireTime}`
                  : '-'}
              </Descriptions.Item>
              {currentRecord.approvalRecord && (
                <>
                  <Descriptions.Item label="审批人">{currentRecord.approvalRecord.approverName}</Descriptions.Item>
                  <Descriptions.Item label="审批时间">{currentRecord.approvalRecord.approvalTime}</Descriptions.Item>
                  <Descriptions.Item label="审批意见" span={2}>{currentRecord.approvalRecord.approvalOpinion}</Descriptions.Item>
                </>
              )}
            </Descriptions>

            <Descriptions title="办件结果" bordered column={2} size="small">
              <Descriptions.Item label="结果状态">
                {currentRecord.hasResult
                  ? <Tag color={resultStatusText[currentRecord.resultStatus || 'completed'].color}>
                      {resultStatusText[currentRecord.resultStatus || 'completed'].text}
                    </Tag>
                  : <Tag color="gold">无办结结果</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="关联投诉">
                {currentRecord.isComplained ? <Tag color="red">是（{currentRecord.complainId}）</Tag> : '否'}
              </Descriptions.Item>
              {currentRecord.complaintContent && (
                <Descriptions.Item label="投诉内容" span={2}>{currentRecord.complaintContent}</Descriptions.Item>
              )}
            </Descriptions>

            {currentRecord.riskTags.length > 0 && (
              <Card size="small" title={<span style={{ color: '#ff4d4f' }}><WarningOutlined /> 风险点说明</span>}>
                <Space direction="vertical" size={8}>
                  {currentRecord.riskTags.map(tag => {
                    const info = abnormalTagPool.find(t => t.tag === tag);
                    return (
                      <div key={tag} style={{ padding: 8, background: '#fff2f0', borderRadius: 4, borderLeft: '3px solid #ff4d4f' }}>
                        <Space>
                          <Tag color="red" icon={info?.icon} style={{ margin: 0 }}>{tag}</Tag>
                          <Text type="secondary">{info?.desc}</Text>
                        </Space>
                      </div>
                    );
                  })}
                </Space>
              </Card>
            )}

            {currentRecord.remark && (
              <Descriptions title="备注" bordered column={1} size="small">
                <Descriptions.Item>{currentRecord.remark}</Descriptions.Item>
              </Descriptions>
            )}
          </Space>
        )}
      </Drawer>

      <Modal
        title={
          <Space>
            <PlusOutlined />
            风险线索登记
          </Space>
        }
        open={registerVisible}
        onCancel={() => setRegisterVisible(false)}
        onOk={() => registerForm.submit()}
        width={720}
        destroyOnClose
      >
        <Form
          form={registerForm}
          layout="vertical"
          onFinish={handleRegisterClue}
          initialValues={{ riskLevel: 'medium', priority: 'normal', tags: [] }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="线索标题" name="title" rules={[{ required: true, message: '请输入线索标题' }]}>
                <Input placeholder="请简要描述线索内容" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="线索类型" name="type" rules={[{ required: true }]}>
                <Select>
                  <Option value="无审批调证">无审批调证</Option>
                  <Option value="多部门交叉查询">多部门交叉查询</Option>
                  <Option value="高频查询无办结">高频查询无办结</Option>
                  <Option value="授权异常">授权异常</Option>
                  <Option value="投诉线索">投诉线索</Option>
                  <Option value="其他异常">其他异常</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="风险等级" name="riskLevel" rules={[{ required: true }]}>
                <Radio.Group>
                  <Radio.Button value="high"><span style={{ color: '#ff4d4f' }}>高风险</span></Radio.Button>
                  <Radio.Button value="medium"><span style={{ color: '#faad14' }}>中风险</span></Radio.Button>
                  <Radio.Button value="low"><span style={{ color: '#52c41a' }}>低风险</span></Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="涉及单位" name="unitId" rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="label">
                  {units.map(u => <Option key={u.id} value={u.id} label={u.name}>{u.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="涉及人员" name="personnelId">
                <Select showSearch optionFilterProp="label" allowClear placeholder="可选">
                  {personnel.map(p => <Option key={p.id} value={p.id} label={p.name}>{p.name} - {p.unitName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="优先级别" name="priority">
                <Radio.Group>
                  <Radio.Button value="urgent">紧急</Radio.Button>
                  <Radio.Button value="high">高</Radio.Button>
                  <Radio.Button value="normal">普通</Radio.Button>
                  <Radio.Button value="low">低</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="标签" name="tags">
                <Select mode="tags" placeholder="按回车添加标签" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="关联记录ID" name="relatedRecordIds" tooltip="系统自动填充从筛查页面选中的记录">
            <Select mode="tags" placeholder="选择或输入记录ID" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="详细描述" name="description" rules={[{ required: true, message: '请输入详细描述' }]}>
            <TextArea rows={4} placeholder="请详细描述异常行为、涉及范围、初步判断等" showCount maxLength={1000} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
