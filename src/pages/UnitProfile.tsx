import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Statistic,
  Progress,
  Descriptions,
  Tabs,
  Select,
  Typography,
  Space,
  Button,
  Drawer,
  Empty,
  Divider,
  Radio,
  Badge,
  Tooltip,
  List
} from 'antd';
import {
  TeamOutlined,
  RiseOutlined,
  SafetyOutlined,
  WarningOutlined,
  AlertOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  FileSearchOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  RadarChartOutlined
} from '@ant-design/icons';
import { Line, Column, Radar, Pie, DualAxes } from '@ant-design/charts';
import { useAuditStore } from '../store/useAuditStore';
import { UnitComplianceMetrics } from '../types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const levelColor: Record<string, string> = {
  excellent: 'green',
  good: 'blue',
  fair: 'cyan',
  poor: 'orange',
  critical: 'red'
};
const levelText: Record<string, string> = {
  excellent: '优秀',
  good: '良好',
  fair: '一般',
  poor: '较差',
  critical: '危险'
};

export default function UnitProfile() {
  const {
    units,
    unitComplianceMetrics,
    callRecords,
    dailyStats,
    personnel,
    matters
  } = useAuditStore();

  const [selectedUnitId, setSelectedUnitId] = useState<string>(units[0]?.id || '');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'riskScore' | 'abnormalCount' | 'complianceRate'>('riskScore');
  const [period, setPeriod] = useState('2026年5月');

  const selectedUnit = units.find(u => u.id === selectedUnitId);
  const selectedMetrics = unitComplianceMetrics.find(m => m.unitId === selectedUnitId);

  const sortedUnits = useMemo(() => {
    const withMetrics = units.map(u => {
      const m = unitComplianceMetrics.find(x => x.unitId === u.id);
      return {
        ...u,
        complianceRate: m ? (m.approvalRate + m.resultRate) / 2 : u.complianceRate,
        abnormalCount: m ? (m.unauthorizedCalls + m.expiredAuthCalls + m.abnormalPatternCount) : u.abnormalCount
      };
    });
    return withMetrics.sort((a, b) => {
      if (sortBy === 'riskScore') return b.riskScore - a.riskScore;
      if (sortBy === 'abnormalCount') return b.abnormalCount - a.abnormalCount;
      return a.complianceRate - b.complianceRate;
    });
  }, [units, unitComplianceMetrics, sortBy]);

  const unitRecords = useMemo(() => {
    return callRecords.filter(r => r.unitId === selectedUnitId);
  }, [callRecords, selectedUnitId]);

  const unitPersonnel = useMemo(() => {
    return personnel.filter(p => p.unitId === selectedUnitId).map(p => {
      const pRecords = unitRecords.filter(r => r.personnelId === p.id);
      const abnormal = pRecords.filter(r => r.riskTags.length > 0).length;
      const highRisk = pRecords.filter(r => r.riskLevel === 'high').length;
      const noApproval = pRecords.filter(r => !r.hasApproval).length;
      return {
        ...p,
        totalCalls: pRecords.length,
        abnormal,
        highRisk,
        noApproval,
        abnormalRate: pRecords.length > 0 ? (abnormal / pRecords.length * 100).toFixed(1) : '0'
      };
    }).sort((a, b) => b.abnormal - a.abnormal);
  }, [personnel, unitRecords, selectedUnitId]);

  const unitMatters = useMemo(() => {
    const map: Record<string, { id: string; name: string; total: number; abnormal: number; highRisk: number; noApproval: number }> = {};
    unitRecords.forEach(r => {
      if (!map[r.matterId]) {
        map[r.matterId] = { id: r.matterId, name: r.matterName, total: 0, abnormal: 0, highRisk: 0, noApproval: 0 };
      }
      map[r.matterId].total++;
      if (r.riskTags.length > 0) map[r.matterId].abnormal++;
      if (r.riskLevel === 'high') map[r.matterId].highRisk++;
      if (!r.hasApproval) map[r.matterId].noApproval++;
    });
    return Object.values(map)
      .map(m => ({ ...m, abnormalRate: m.total > 0 ? (m.abnormal / m.total * 100).toFixed(1) : '0' }))
      .sort((a, b) => b.abnormal - a.abnormal);
  }, [unitRecords]);

  const unitCertTypes = useMemo(() => {
    const map: Record<string, number> = {};
    unitRecords.forEach(r => {
      map[r.certType] = (map[r.certType] || 0) + 1;
    });
    return Object.entries(map)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [unitRecords]);

  const unitDailyStats = useMemo(() => {
    const map: Record<string, { total: number; abnormal: number }> = {};
    unitRecords.forEach(r => {
      const date = r.callTime.split(' ')[0];
      if (!map[date]) map[date] = { total: 0, abnormal: 0 };
      map[date].total++;
      if (r.riskTags.length > 0) map[date].abnormal++;
    });
    return dailyStats.map(d => map[d.date] || { total: 0, abnormal: 0 }).map((v, i) => ({
      date: dailyStats[i].date,
      totalCalls: v.total,
      abnormalCalls: v.abnormal
    }));
  }, [unitRecords, dailyStats]);

  const riskLevelStats = useMemo(() => {
    const high = unitRecords.filter(r => r.riskLevel === 'high').length;
    const medium = unitRecords.filter(r => r.riskLevel === 'medium').length;
    const low = unitRecords.filter(r => r.riskLevel === 'low').length;
    return [
      { type: '高风险', value: high },
      { type: '中风险', value: medium },
      { type: '低风险', value: low }
    ];
  }, [unitRecords]);

  const radarData = useMemo(() => {
    if (!selectedMetrics) return [];
    const labels: Record<string, string> = {
      approvalCompliance: '审批合规',
      authorizationAccuracy: '授权准确',
      resultEfficiency: '办结效率',
      complaintHandling: '投诉处理',
      operationStandardization: '操作规范'
    };
    return Object.entries(selectedMetrics.dimensionScores).map(([k, v]) => ({
      item: labels[k] || k,
      score: v,
      type: selectedUnit?.name || ''
    }));
  }, [selectedMetrics, selectedUnit]);

  const allUnitsRadar = useMemo(() => {
    const labels: Record<string, string> = {
      approvalCompliance: '审批合规',
      authorizationAccuracy: '授权准确',
      resultEfficiency: '办结效率',
      complaintHandling: '投诉处理',
      operationStandardization: '操作规范'
    };
    const avgScores: Record<string, number> = {};
    Object.keys(labels).forEach(k => {
      avgScores[k] = unitComplianceMetrics.reduce((s, m) => s + (m.dimensionScores as any)[k], 0) / unitComplianceMetrics.length;
    });

    return [
      ...radarData,
      ...Object.entries(avgScores).map(([k, v]) => ({
        item: labels[k] || k,
        score: Number(v.toFixed(1)),
        type: '全市平均'
      }))
    ];
  }, [unitComplianceMetrics, radarData]);

  const columns: ColumnsType<typeof sortedUnits[0]> = [
    {
      title: '排名',
      key: 'rank',
      width: 70,
      render: (_, __, i) => (
        <Tag color={i < 3 ? 'red' : i < 6 ? 'orange' : 'default'}>{i + 1}</Tag>
      )
    },
    {
      title: '单位名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      ellipsis: true,
      render: (v, r) => (
        <a onClick={() => { setSelectedUnitId(r.id); setDrawerVisible(true); }}>
          {v}
        </a>
      )
    },
    { title: '类别', dataIndex: 'category', key: 'category', width: 100 },
    { title: '总调证次数', dataIndex: 'totalCalls', key: 'totalCalls', width: 120, sorter: (a, b) => b.totalCalls - a.totalCalls },
    {
      title: '风险评分',
      key: 'riskScore',
      width: 200,
      render: (_, r) => (
        <Progress
          percent={r.riskScore}
          size="small"
          strokeColor={r.riskScore >= 70 ? '#ff4d4f' : r.riskScore >= 50 ? '#faad14' : '#52c41a'}
          format={(p: number | undefined) => <Text strong style={{ color: (p ?? 0) >= 70 ? '#ff4d4f' : (p ?? 0) >= 50 ? '#faad14' : '#52c41a' }}>{p ?? 0} 分</Text>}
        />
      )
    },
    { title: '合规率', dataIndex: 'complianceRate', key: 'complianceRate', width: 100, sorter: (a, b) => b.complianceRate - a.complianceRate, render: v => `${v}%` },
    { title: '异常次数', dataIndex: 'abnormalCount', key: 'abnormalCount', width: 100, sorter: (a, b) => b.abnormalCount - a.abnormalCount, render: v => <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{v}</span> },
    {
      title: '合规等级',
      key: 'level',
      width: 100,
      render: (_, r) => {
        const m = unitComplianceMetrics.find(x => x.unitId === r.id);
        const l = m?.complianceLevel || 'fair';
        return <Tag color={levelColor[l]} style={{ margin: 0 }}>{levelText[l]}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, r) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedUnitId(r.id); setDrawerVisible(true); }}>
          画像
        </Button>
      )
    }
  ];

  const lineConfig = {
    data: unitDailyStats,
    xField: 'date',
    yField: ['totalCalls', 'abnormalCalls'],
    xAxis: { label: { autoHide: true, autoRotate: false } },
    legend: { position: 'top' },
    smooth: true,
    color: ['#1677ff', '#ff4d4f'],
    height: 260
  };

  const columnConfig = {
    data: unitMatters,
    xField: 'name',
    yField: ['total', 'abnormal'],
    isGroup: true,
    xAxis: { label: { autoHide: true, autoRotate: false } },
    legend: { position: 'top' },
    color: ['#1677ff', '#ff7a45'],
    height: 260
  };

  const pieConfig = {
    data: riskLevelStats,
    angleField: 'value',
    colorField: 'type',
    color: ['#ff4d4f', '#faad14', '#52c41a'],
    radius: 0.9,
    legend: { position: 'bottom' },
    label: { text: 'value' },
    height: 260
  };

  const certPieConfig = {
    data: unitCertTypes,
    angleField: 'count',
    colorField: 'type',
    radius: 0.9,
    legend: { position: 'bottom' },
    height: 260
  };

  const radarConfig = {
    data: allUnitsRadar,
    xField: 'item',
    yField: 'score',
    seriesField: 'type',
    meta: { score: { max: 100, min: 0 } },
    point: { size: 4, shape: 'diamond' },
    area: { style: { fillOpacity: 0.15 } },
    legend: { position: 'bottom' },
    height: 300
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card size="small" title={<Space><RadarChartOutlined />单位合规画像总览</Space>}>
        <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
          <Col xs={24} md={8}>
            <Radio.Group value={sortBy} onChange={e => setSortBy(e.target.value)} optionType="button" buttonStyle="solid">
              <Radio.Button value="riskScore">按风险评分</Radio.Button>
              <Radio.Button value="abnormalCount">按异常次数</Radio.Button>
              <Radio.Button value="complianceRate">按合规率</Radio.Button>
            </Radio.Group>
          </Col>
          <Col xs={24} md={8}>
            <Select value={period} onChange={setPeriod} style={{ width: '100%' }}>
              <Option value="2026年5月">2026年5月</Option>
              <Option value="2026年4月">2026年4月</Option>
              <Option value="2026年Q1">2026年第一季度</Option>
              <Option value="2026年上半年">2026年上半年</Option>
            </Select>
          </Col>
        </Row>

        <Table
          size="small"
          rowKey="id"
          columns={columns}
          dataSource={sortedUnits}
          scroll={{ x: 1200 }}
          pagination={{ showSizeChanger: true, showTotal: t => `共 ${t} 家单位`, pageSize: 10 }}
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card size="small" title={<Space><RadarChartOutlined style={{ color: '#722ed1' }} /> 五维合规能力对比</Space>}>
            <Radar {...radarConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title={<Space><TeamOutlined style={{ color: '#1677ff' }} /> 单位合规等级分布</Space>}>
            <Pie
              data={[
                { type: '优秀', value: unitComplianceMetrics.filter(m => m.complianceLevel === 'excellent').length },
                { type: '良好', value: unitComplianceMetrics.filter(m => m.complianceLevel === 'good').length },
                { type: '一般', value: unitComplianceMetrics.filter(m => m.complianceLevel === 'fair').length },
                { type: '较差', value: unitComplianceMetrics.filter(m => m.complianceLevel === 'poor').length },
                { type: '危险', value: unitComplianceMetrics.filter(m => m.complianceLevel === 'critical').length }
              ]}
              angleField="value"
              colorField="type"
              color={['#52c41a', '#1677ff', '#13c2c2', '#faad14', '#ff4d4f']}
              radius={0.9}
              legend={{ position: 'bottom' }}
              label={{ text: 'value' }}
              height={260}
            />
          </Card>
        </Col>
      </Row>

      <Drawer
        title={
          <Space>
            <TeamOutlined />
            {selectedUnit?.name} - 合规画像详情
          </Space>
        }
        width={1000}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedUnit && selectedMetrics ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col xs={12} md={6}>
                <Card size="small" className="stat-card stat-card-blue">
                  <Statistic
                    title={<span style={{ color: '#fff', opacity: 0.9 }}>本期调证总量</span>}
                    value={selectedMetrics.totalCalls}
                    valueStyle={{ color: '#fff' }}
                    suffix="次"
                    prefix={<FileSearchOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card size="small" className="stat-card stat-card-green">
                  <Statistic
                    title={<span style={{ color: '#fff', opacity: 0.9 }}>审批合规率</span>}
                    value={selectedMetrics.approvalRate}
                    valueStyle={{ color: '#fff' }}
                    suffix="%"
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card size="small" className="stat-card stat-card-orange">
                  <Statistic
                    title={<span style={{ color: '#fff', opacity: 0.9 }}>异常行为数</span>}
                    value={selectedMetrics.abnormalPatternCount}
                    valueStyle={{ color: '#fff' }}
                    suffix="起"
                    prefix={<ThunderboltOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card size="small" className="stat-card stat-card-red">
                  <Statistic
                    title={<span style={{ color: '#fff', opacity: 0.9 }}>投诉件数</span>}
                    value={selectedMetrics.complaintCount}
                    valueStyle={{ color: '#fff' }}
                    suffix="件"
                    prefix={<AlertOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Descriptions title="单位基本信息" bordered column={2} size="small">
              <Descriptions.Item label="单位名称" span={2}>{selectedUnit.name}</Descriptions.Item>
              <Descriptions.Item label="单位类别">{selectedUnit.category}</Descriptions.Item>
              <Descriptions.Item label="机构级别">{selectedUnit.level}</Descriptions.Item>
              <Descriptions.Item label="联系人">{selectedUnit.contactPerson}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{selectedUnit.contactPhone}</Descriptions.Item>
              <Descriptions.Item label="办公地址" span={2}>{selectedUnit.address}</Descriptions.Item>
            </Descriptions>

            <Card size="small" title={<Space><RiseOutlined /> 综合风险评估</Space>}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <div>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Text>风险评分</Text>
                        <Text strong style={{ color: selectedUnit.riskScore >= 70 ? '#ff4d4f' : selectedUnit.riskScore >= 50 ? '#faad14' : '#52c41a', fontSize: 16 }}>
                          {selectedUnit.riskScore}/100
                        </Text>
                      </Space>
                      <Progress
                        percent={selectedUnit.riskScore}
                        strokeColor={selectedUnit.riskScore >= 70 ? '#ff4d4f' : selectedUnit.riskScore >= 50 ? '#faad14' : '#52c41a'}
                        size={['100%', 16]}
                      />
                    </div>
                    <div>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Text>综合合规率</Text>
                        <Text strong style={{ color: '#52c41a', fontSize: 16 }}>{selectedUnit.complianceRate}%</Text>
                      </Space>
                      <Progress percent={selectedUnit.complianceRate} strokeColor="#52c41a" size={['100%', 16]} />
                    </div>
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <div>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Text>合规等级</Text>
                        <Tag color={levelColor[selectedMetrics.complianceLevel]} style={{ fontSize: 16, padding: '4px 12px' }}>
                          {levelText[selectedMetrics.complianceLevel]}
                        </Tag>
                      </Space>
                    </div>
                    <Row gutter={8}>
                      <Col span={8}>
                        <Card size="small" style={{ textAlign: 'center' }}>
                          <Statistic title="无审批调证" value={selectedMetrics.unauthorizedCalls} valueStyle={{ color: '#ff4d4f', fontSize: 18 }} />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card size="small" style={{ textAlign: 'center' }}>
                          <Statistic title="授权过期" value={selectedMetrics.expiredAuthCalls} valueStyle={{ color: '#faad14', fontSize: 18 }} />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card size="small" style={{ textAlign: 'center' }}>
                          <Statistic title="办结率" value={selectedMetrics.resultRate} suffix="%" valueStyle={{ color: '#52c41a', fontSize: 18 }} />
                        </Card>
                      </Col>
                    </Row>
                  </Space>
                </Col>
              </Row>
            </Card>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={14}>
                <Card size="small" title={<Space><ClockCircleOutlined /> 调证量与异常趋势</Space>}>
                  <Line {...lineConfig} />
                </Card>
              </Col>
              <Col xs={24} lg={10}>
                <Card size="small" title={<Space><AlertOutlined /> 风险等级分布</Space>}>
                  <Pie {...pieConfig} />
                </Card>
              </Col>
            </Row>

            <Card size="small" title={<Space><RadarChartOutlined /> 五维能力画像（与全市平均对比）</Space>}>
              <Radar {...radarConfig} />
            </Card>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={14}>
                <Card size="small" title={<Space><WarningOutlined style={{ color: '#ff4d4f' }} /> 按事项异常情况</Space>}>
                  <Column {...columnConfig} />
                </Card>
              </Col>
              <Col xs={24} lg={10}>
                <Card size="small" title={<Space><FileSearchOutlined /> 高频证照类型</Space>}>
                  <Pie {...certPieConfig} />
                </Card>
              </Col>
            </Row>

            <Card size="small" title={<Space><UserOutlined /> 工作人员合规排行</Space>}>
              {unitPersonnel.length > 0 ? (
                <Table
                  size="small"
                  rowKey="id"
                  pagination={false}
                  dataSource={unitPersonnel}
                  columns={[
                    { title: '姓名', dataIndex: 'name', width: 100 },
                    { title: '职务', dataIndex: 'position', width: 120 },
                    { title: '调证次数', dataIndex: 'totalCalls', width: 100 },
                    { title: '异常次数', dataIndex: 'abnormal', width: 100, render: v => <Text strong style={{ color: v > 0 ? '#ff4d4f' : '#52c41a' }}>{v}</Text> },
                    { title: '高风险', dataIndex: 'highRisk', width: 100, render: v => v > 0 ? <Tag color="red">{v}</Tag> : '-' },
                    { title: '无审批', dataIndex: 'noApproval', width: 100, render: v => v > 0 ? <Tag color="orange">{v}</Tag> : '-' },
                    {
                      title: '异常率',
                      key: 'rate',
                      render: (_, r) => <Progress percent={Number(r.abnormalRate)} size="small" strokeColor="#ff4d4f" style={{ width: 120 }} />
                    }
                  ]}
                />
              ) : (
                <Empty description="暂无人员数据" />
              )}
            </Card>
          </Space>
        ) : (
          <Empty />
        )}
      </Drawer>
    </Space>
  );
}
