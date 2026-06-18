import { useMemo } from 'react';
import { Card, Col, Row, Statistic, Tag, Progress, Table, Space, Typography, List, Badge } from 'antd';
import {
  FileSearchOutlined,
  WarningOutlined,
  SafetyOutlined,
  AlertOutlined,
  RiseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { Line, Column, Pie, Radar } from '@ant-design/charts';
import { useAuditStore } from '../store/useAuditStore';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const riskLevelColor: Record<string, string> = {
  high: '#ff4d4f',
  medium: '#faad14',
  low: '#52c41a'
};

const riskLevelText: Record<string, string> = {
  high: '高风险',
  medium: '中风险',
  low: '低风险'
};

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    callRecords,
    riskClues,
    units,
    unitComplianceMetrics,
    dailyStats,
    personnel,
    matters
  } = useAuditStore();

  const totalCalls = callRecords.length;
  const totalAbnormal = callRecords.filter(r => r.riskTags.length > 0).length;
  const totalHighRisk = callRecords.filter(r => r.riskLevel === 'high').length;
  const totalComplaints = callRecords.filter(r => r.isComplained).length;

  const topUnits = useMemo(() => {
    const unitMap: Record<string, { name: string; total: number; abnormal: number; highRisk: number }> = {};
    callRecords.forEach(r => {
      if (!unitMap[r.unitId]) {
        unitMap[r.unitId] = { name: r.unitName, total: 0, abnormal: 0, highRisk: 0 };
      }
      unitMap[r.unitId].total++;
      if (r.riskTags.length > 0) unitMap[r.unitId].abnormal++;
      if (r.riskLevel === 'high') unitMap[r.unitId].highRisk++;
    });
    return Object.values(unitMap)
      .map(u => ({ ...u, rate: u.total > 0 ? (u.abnormal / u.total * 100).toFixed(1) : '0' }))
      .sort((a, b) => Number(b.rate) - Number(a.rate))
      .slice(0, 5);
  }, [callRecords]);

  const topPersonnel = useMemo(() => {
    const pMap: Record<string, { name: string; unitName: string; total: number; abnormal: number }> = {};
    callRecords.forEach(r => {
      if (!pMap[r.personnelId]) {
        pMap[r.personnelId] = { name: r.personnelName, unitName: r.unitName, total: 0, abnormal: 0 };
      }
      pMap[r.personnelId].total++;
      if (r.riskTags.length > 0) pMap[r.personnelId].abnormal++;
    });
    return Object.values(pMap)
      .sort((a, b) => b.abnormal - a.abnormal)
      .slice(0, 5);
  }, [callRecords]);

  const certTypeStats = useMemo(() => {
    const map: Record<string, number> = {};
    callRecords.forEach(r => {
      map[r.certType] = (map[r.certType] || 0) + 1;
    });
    return Object.entries(map)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [callRecords]);

  const riskLevelData = useMemo(() => {
    const high = callRecords.filter(r => r.riskLevel === 'high').length;
    const medium = callRecords.filter(r => r.riskLevel === 'medium').length;
    const low = callRecords.filter(r => r.riskLevel === 'low').length;
    return [
      { type: '高风险', value: high },
      { type: '中风险', value: medium },
      { type: '低风险', value: low }
    ];
  }, [callRecords]);

  const lineConfig = {
    data: dailyStats,
    xField: 'date',
    yField: ['totalCalls', 'approvedCalls', 'abnormalCalls'],
    xAxis: { label: { autoHide: true, autoRotate: false } },
    legend: { position: 'top' },
    smooth: true,
    color: ['#1677ff', '#52c41a', '#ff4d4f'],
    height: 300
  };

  const columnConfig = {
    data: topUnits,
    xField: 'name',
    yField: ['total', 'abnormal'],
    isGroup: true,
    xAxis: { label: { autoHide: true, autoRotate: false } },
    legend: { position: 'top' },
    label: { position: 'middle', layout: [{ type: 'interval-adjust-position' }] },
    color: ['#1677ff', '#ff7a45'],
    height: 300
  };

  const pieConfig = {
    data: riskLevelData,
    angleField: 'value',
    colorField: 'type',
    color: ['#ff4d4f', '#faad14', '#52c41a'],
    radius: 0.9,
    label: { text: 'value', style: { fontWeight: 'bold' } },
    legend: { position: 'bottom' },
    height: 300
  };

  const radarData = useMemo(() => {
    const avgMetrics = unitComplianceMetrics[0]?.dimensionScores || {};
    return Object.entries(avgMetrics).map(([name, score]) => ({
      item: {
        approvalCompliance: '审批合规',
        authorizationAccuracy: '授权准确',
        resultEfficiency: '办结效率',
        complaintHandling: '投诉处理',
        operationStandardization: '操作规范'
      }[name] || name,
      score,
      type: '全市平均'
    }));
  }, [unitComplianceMetrics]);

  const radarConfig = {
    data: radarData,
    xField: 'item',
    yField: 'score',
    meta: { score: { max: 100, min: 0 } },
    point: { size: 4, shape: 'diamond' },
    area: { style: { fillOpacity: 0.2 } },
    height: 300
  };

  const recentClues = riskClues.slice(0, 5);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-blue">
            <Statistic
              title={<span style={{ color: '#fff', opacity: 0.9 }}>累计调证次数</span>}
              value={totalCalls}
              suffix="次"
              valueStyle={{ color: '#fff' }}
              prefix={<FileSearchOutlined />}
            />
            <div style={{ marginTop: 8, color: '#fff', opacity: 0.85, fontSize: 12 }}>
              <ArrowUpOutlined /> 较上月增长 12.5%
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-orange">
            <Statistic
              title={<span style={{ color: '#fff', opacity: 0.9 }}>异常调用记录</span>}
              value={totalAbnormal}
              suffix="条"
              valueStyle={{ color: '#fff' }}
              prefix={<WarningOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Progress
                percent={Number((totalAbnormal / totalCalls * 100).toFixed(1))}
                format={(percent: number | undefined) => <span style={{ color: '#fff' }}>{percent ?? 0}%</span>}
                size="small"
                strokeColor="#fff"
                trailColor="rgba(255,255,255,0.3)"
              />
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-red">
            <Statistic
              title={<span style={{ color: '#fff', opacity: 0.9 }}>高风险线索</span>}
              value={totalHighRisk}
              suffix="条"
              valueStyle={{ color: '#fff' }}
              prefix={<AlertOutlined />}
            />
            <div style={{ marginTop: 8, color: '#fff', opacity: 0.85, fontSize: 12 }}>
              <ArrowDownOutlined /> 较上月下降 8.2%
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-green">
            <Statistic
              title={<span style={{ color: '#fff', opacity: 0.9 }}>投诉核查件</span>}
              value={totalComplaints}
              suffix="件"
              valueStyle={{ color: '#fff' }}
              prefix={<SafetyOutlined />}
            />
            <div style={{ marginTop: 8, color: '#fff', opacity: 0.85, fontSize: 12 }}>
              按期办结率 92.3%
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <RiseOutlined />
                调证量与异常趋势（近50天）
              </Space>
            }
            size="small"
            extra={<Tag color="blue">实时数据</Tag>}
          >
            <Line {...lineConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <AlertOutlined />
                风险等级分布
              </Space>
            }
            size="small"
          >
            <Pie {...pieConfig} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <WarningOutlined />
                各单位异常情况对比（TOP5）
              </Space>
            }
            size="small"
            extra={
              <a onClick={() => navigate('/unit-profile')}>查看全部 →</a>
            }
          >
            <Column {...columnConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <SafetyOutlined />
                合规能力雷达图
              </Space>
            }
            size="small"
          >
            <Radar {...radarConfig} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FileSearchOutlined />
                高频证照类型
              </Space>
            }
            size="small"
          >
            <List
              dataSource={certTypeStats}
              renderItem={(item) => (
                <List.Item>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                      <Tag color="blue">{item.type}</Tag>
                    </Space>
                    <Space>
                      <Progress
                        percent={Number((item.count / certTypeStats[0].count * 100).toFixed(0))}
                        size="small"
                        style={{ width: 150 }}
                      />
                      <Text strong>{item.count} 次</Text>
                    </Space>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <AlertOutlined />
                最新风险线索
              </Space>
            }
            size="small"
            extra={
              <a onClick={() => navigate('/case-management')}>全部线索 →</a>
            }
          >
            <List
              dataSource={recentClues}
              renderItem={(item) => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/case-management')}
                >
                  <Space style={{ width: '100%', justifyContent: 'space-between' }} align="start">
                    <Space direction="vertical" size={4}>
                      <Space>
                        <Badge
                          color={riskLevelColor[item.riskLevel]}
                          text={<span style={{ fontWeight: 600 }}>{riskLevelText[item.riskLevel]}</span>}
                        />
                        <Text strong>{item.title}</Text>
                      </Space>
                      <Space size={8}>
                        <Tag color="purple">{item.type}</Tag>
                        <Tag>{item.unitName}</Tag>
                        {item.personnelName && <Tag color="cyan">@{item.personnelName}</Tag>}
                      </Space>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.discoveredTime} · {item.discoveredBy}
                      </Text>
                    </Space>
                    <Tag color={
                      item.status === 'pending' ? 'default' :
                      item.status === 'investigating' ? 'processing' :
                      item.status === 'verified' ? 'success' : 'warning'
                    }>
                      {
                        item.status === 'pending' ? '待核实' :
                        item.status === 'investigating' ? '核查中' :
                        item.status === 'verified' ? '已核实' : '已结案'
                      }
                    </Tag>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <AlertOutlined style={{ color: '#ff4d4f' }} />
                异常人员排行（TOP5）
              </Space>
            }
            size="small"
          >
            <Table
              size="small"
              pagination={false}
              dataSource={topPersonnel}
              rowKey={(r, i) => `p-${i}`}
              columns={[
                { title: '排名', dataIndex: 'index', key: 'index', width: 60, render: (_, __, i) => <Tag color={i < 3 ? 'red' : 'orange'}>{i + 1}</Tag> },
                { title: '姓名', dataIndex: 'name', key: 'name' },
                { title: '所属单位', dataIndex: 'unitName', key: 'unitName', ellipsis: true },
                { title: '调证次数', dataIndex: 'total', key: 'total' },
                { title: '异常次数', dataIndex: 'abnormal', key: 'abnormal', render: v => <span className="risk-high">{v}</span> }
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <TeamOutlined />
                单位合规概况
              </Space>
            }
            size="small"
          >
            <Table
              size="small"
              pagination={false}
              dataSource={units.slice(0, 5)}
              rowKey="id"
              columns={[
                { title: '单位', dataIndex: 'name', key: 'name', ellipsis: true },
                { title: '风险评分', dataIndex: 'riskScore', key: 'riskScore', render: v => (
                  <Progress
                    percent={v}
                    size="small"
                    strokeColor={v >= 70 ? '#ff4d4f' : v >= 50 ? '#faad14' : '#52c41a'}
                    style={{ width: 100 }}
                  />
                )},
                { title: '合规率', dataIndex: 'complianceRate', key: 'complianceRate', render: v => `${v}%` },
                { title: '等级', key: 'level', render: (_, r) => {
                  const metric = unitComplianceMetrics.find(m => m.unitId === r.id);
                  const colors: Record<string, string> = { excellent: 'green', good: 'blue', fair: 'cyan', poor: 'orange', critical: 'red' };
                  const texts: Record<string, string> = { excellent: '优秀', good: '良好', fair: '一般', poor: '较差', critical: '危险' };
                  return <Tag color={colors[metric?.complianceLevel || 'fair']}>{texts[metric?.complianceLevel || 'fair']}</Tag>;
                }}
              ]}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
