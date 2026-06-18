import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Radio,
  DatePicker,
  Statistic,
  Drawer,
  Descriptions,
  Divider,
  Timeline,
  App,
  Typography,
  Tabs,
  Progress,
  Badge,
  List,
  Tooltip,
  Avatar,
  Empty,
  Alert
} from 'antd';
import {
  FileProtectOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  SearchOutlined,
  WarningOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
  TeamOutlined,
  UserOutlined,
  FileSearchOutlined,
  ExclamationCircleOutlined,
  MessageOutlined,
  LinkOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { Column } from '@ant-design/charts';
import { useAuditStore } from '../store/useAuditStore';
import { RiskClue, CaseStatus, AccountabilityStatus, RiskLevel } from '../types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
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

const caseStatusConfig: Record<CaseStatus, { text: string; color: string; icon: React.ReactNode }> = {
  pending: { text: '待核实', color: 'default', icon: <ClockCircleOutlined /> },
  investigating: { text: '核查中', color: 'processing', icon: <SearchOutlined /> },
  verified: { text: '已核实', color: 'success', icon: <CheckCircleOutlined /> },
  closed: { text: '已结案', color: 'warning', icon: <FileProtectOutlined /> }
};

const priorityConfig: Record<string, { text: string; color: string }> = {
  urgent: { text: '紧急', color: 'red' },
  high: { text: '高', color: 'orange' },
  normal: { text: '普通', color: 'blue' },
  low: { text: '低', color: 'default' }
};

const accountabilityConfig: Record<AccountabilityStatus, { text: string; color: string }> = {
  none: { text: '不涉及', color: 'default' },
  pending: { text: '待处理', color: 'orange' },
  processing: { text: '处理中', color: 'processing' },
  completed: { text: '已完成', color: 'success' }
};

export default function CaseManagement() {
  const { message } = App.useApp();
  const { riskClues, updateRiskClue, callRecords, units, personnel } = useAuditStore();

  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<CaseStatus | undefined>();
  const [filterRisk, setFilterRisk] = useState<RiskLevel | undefined>();
  const [filterAccountability, setFilterAccountability] = useState<AccountabilityStatus | undefined>();
  const [selectedClue, setSelectedClue] = useState<RiskClue | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [conclusionVisible, setConclusionVisible] = useState(false);
  const [accountabilityVisible, setAccountabilityVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [conclusionForm] = Form.useForm();
  const [accountabilityForm] = Form.useForm();

  const filteredClues = useMemo(() => {
    return riskClues.filter(clue => {
      if (filterStatus && clue.status !== filterStatus) return false;
      if (filterRisk && clue.riskLevel !== filterRisk) return false;
      if (filterAccountability && clue.accountabilityStatus !== filterAccountability) return false;
      if (searchText) {
        const text = searchText.toLowerCase();
        return (
          clue.title.toLowerCase().includes(text) ||
          clue.clueNo.toLowerCase().includes(text) ||
          clue.unitName.toLowerCase().includes(text) ||
          (clue.personnelName && clue.personnelName.toLowerCase().includes(text)) ||
          clue.type.toLowerCase().includes(text)
        );
      }
      return true;
    });
  }, [riskClues, searchText, filterStatus, filterRisk, filterAccountability]);

  const stats = useMemo(() => ({
    total: riskClues.length,
    pending: riskClues.filter(c => c.status === 'pending').length,
    investigating: riskClues.filter(c => c.status === 'investigating').length,
    verified: riskClues.filter(c => c.status === 'verified').length,
    closed: riskClues.filter(c => c.status === 'closed').length,
    highRisk: riskClues.filter(c => c.riskLevel === 'high').length,
    withAccountability: riskClues.filter(c => c.accountabilityStatus !== 'none').length
  }), [riskClues]);

  const statusTrend = useMemo(() => {
    return [
      { status: '待核实', count: stats.pending, color: '#8c8c8c' },
      { status: '核查中', count: stats.investigating, color: '#1677ff' },
      { status: '已核实', count: stats.verified, color: '#52c41a' },
      { status: '已结案', count: stats.closed, color: '#faad14' }
    ];
  }, [stats]);

  const relatedRecords = useMemo(() => {
    if (!selectedClue) return [];
    return callRecords.filter(r => selectedClue.relatedRecordIds.includes(r.id));
  }, [selectedClue, callRecords]);

  const columns: ColumnsType<RiskClue> = [
    {
      title: '线索编号',
      dataIndex: 'clueNo',
      key: 'clueNo',
      width: 160,
      render: v => <Text code copyable>{v}</Text>
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (level: RiskLevel) => (
        <Badge color={riskLevelColor[level]} text={<Tag color={riskLevelColor[level]} style={{ margin: 0 }}>{riskLevelText[level]}</Tag>} />
      ),
      filters: [
        { text: '高风险', value: 'high' },
        { text: '中风险', value: 'medium' },
        { text: '低风险', value: 'low' }
      ],
      onFilter: (v, r) => r.riskLevel === v
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 280,
      ellipsis: true,
      render: v => <Text strong>{v}</Text>
    },
    {
      title: '线索类型',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: v => <Tag color="purple">{v}</Tag>
    },
    {
      title: '涉及单位',
      dataIndex: 'unitName',
      key: 'unitName',
      width: 200,
      ellipsis: true
    },
    {
      title: '涉及人员',
      dataIndex: 'personnelName',
      key: 'personnelName',
      width: 100,
      render: v => v || '-'
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, r) => {
        const s = caseStatusConfig[r.status];
        return <Tag color={s.color} icon={s.icon}>{s.text}</Tag>;
      },
      filters: [
        { text: '待核实', value: 'pending' },
        { text: '核查中', value: 'investigating' },
        { text: '已核实', value: 'verified' },
        { text: '已结案', value: 'closed' }
      ],
      onFilter: (v, r) => r.status === v
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (v) => {
        const p = priorityConfig[v];
        return <Tag color={p.color}>{p.text}</Tag>;
      }
    },
    {
      title: '问责状态',
      dataIndex: 'accountabilityStatus',
      key: 'accountabilityStatus',
      width: 100,
      render: (v: AccountabilityStatus) => {
        const c = accountabilityConfig[v];
        return <Tag color={c.color}>{c.text}</Tag>;
      }
    },
    {
      title: '发现时间',
      dataIndex: 'discoveredTime',
      key: 'discoveredTime',
      width: 180
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, r) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedClue(r); setDetailVisible(true); }}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setSelectedClue(r); editForm.setFieldsValue({ ...r, tags: r.tags, relatedRecordIds: r.relatedRecordIds }); setEditVisible(true); }}>编辑</Button>
          {r.status !== 'verified' && r.status !== 'closed' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => { setSelectedClue(r); setConclusionVisible(true); }}>结论</Button>
          )}
          <Button type="link" size="small" icon={<SafetyOutlined />} onClick={() => { setSelectedClue(r); accountabilityForm.setFieldsValue({ accountabilityStatus: r.accountabilityStatus, accountabilityResult: r.accountabilityResult }); setAccountabilityVisible(true); }}>问责</Button>
        </Space>
      )
    }
  ];

  const handleEditSubmit = (values: any) => {
    if (selectedClue) {
      updateRiskClue(selectedClue.id, { ...values });
      message.success('案例信息更新成功');
      setEditVisible(false);
    }
  };

  const handleConclusionSubmit = (values: any) => {
    if (selectedClue) {
      updateRiskClue(selectedClue.id, {
        status: values.status,
        conclusion: values.conclusion,
        conclusionTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
      });
      message.success('核查结论登记成功');
      setConclusionVisible(false);
    }
  };

  const handleAccountabilitySubmit = (values: any) => {
    if (selectedClue) {
      updateRiskClue(selectedClue.id, values);
      message.success('问责信息更新成功');
      setAccountabilityVisible(false);
    }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={4}>
          <Card size="small" className="stat-card stat-card-blue">
            <Statistic
              title={<span style={{ color: '#fff', opacity: 0.9 }}>线索总数</span>}
              value={stats.total}
              suffix="件"
              valueStyle={{ color: '#fff' }}
              prefix={<FileProtectOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card size="small">
            <Statistic
              title={<Space><ClockCircleOutlined /> 待核实</Space>}
              value={stats.pending}
              valueStyle={{ color: '#8c8c8c' }}
              suffix="件"
            />
            <Progress percent={stats.total > 0 ? Math.round(stats.pending / stats.total * 100) : 0} size="small" strokeColor="#8c8c8c" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card size="small">
            <Statistic
              title={<Space><SearchOutlined /> 核查中</Space>}
              value={stats.investigating}
              valueStyle={{ color: '#1677ff' }}
              suffix="件"
            />
            <Progress percent={stats.total > 0 ? Math.round(stats.investigating / stats.total * 100) : 0} size="small" strokeColor="#1677ff" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card size="small">
            <Statistic
              title={<Space><CheckCircleOutlined /> 已核实</Space>}
              value={stats.verified}
              valueStyle={{ color: '#52c41a' }}
              suffix="件"
            />
            <Progress percent={stats.total > 0 ? Math.round(stats.verified / stats.total * 100) : 0} size="small" strokeColor="#52c41a" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card size="small">
            <Statistic
              title={<Space><AlertOutlined style={{ color: '#ff4d4f' }} /> 高风险</Space>}
              value={stats.highRisk}
              valueStyle={{ color: '#ff4d4f' }}
              suffix="件"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card size="small">
            <Statistic
              title={<Space><SafetyOutlined style={{ color: '#faad14' }} /> 已问责</Space>}
              value={stats.withAccountability}
              valueStyle={{ color: '#faad14' }}
              suffix="件"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card size="small" title={<Space><FileProtectOutlined /> 线索状态分布</Space>}>
            <Column
              data={statusTrend}
              xField="status"
              yField="count"
              colorField="status"
              color={['#8c8c8c', '#1677ff', '#52c41a', '#faad14']}
              label={{ position: 'top', style: { fontWeight: 'bold' } }}
              height={240}
              legend={false}
            />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card size="small" title={<Space><WarningOutlined style={{ color: '#ff4d4f' }} /> 紧急 & 高风险线索预警</Space>}>
            <List
              size="small"
              dataSource={riskClues.filter(c => c.priority === 'urgent' || c.priority === 'high').slice(0, 4)}
              locale={{ emptyText: <Empty description="暂无高优先级线索" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
              renderItem={clue => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  onClick={() => { setSelectedClue(clue); setDetailVisible(true); }}
                >
                  <Space style={{ width: '100%', justifyContent: 'space-between' }} align="start">
                    <Space direction="vertical" size={4}>
                      <Space>
                        <Tag color={clue.priority === 'urgent' ? 'red' : 'orange'} style={{ margin: 0 }}>
                          {clue.priority === 'urgent' ? '紧急' : '高优先'}
                        </Tag>
                        <Badge color={riskLevelColor[clue.riskLevel]} text={<Text strong>{riskLevelText[clue.riskLevel]}</Text>} />
                        <Tag color={caseStatusConfig[clue.status].color}>{caseStatusConfig[clue.status].text}</Tag>
                      </Space>
                      <Text strong>{clue.title}</Text>
                      <Space size={8}>
                        <Tag color="purple">{clue.type}</Tag>
                        <Tag>{clue.unitName}</Tag>
                        {clue.personnelName && <Tag color="cyan">@{clue.personnelName}</Tag>}
                      </Space>
                    </Space>
                    <Text type="secondary">{clue.discoveredTime}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card
        size="small"
        title={<Space><FileProtectOutlined /> 风险线索案例库</Space>}
        extra={
          <Space size={[8, 8]} wrap>
            <Input.Search
              placeholder="搜索编号/标题/单位/人员"
              allowClear
              style={{ width: 260 }}
              enterButton={<><SearchOutlined /> 查询</>}
              onSearch={setSearchText}
            />
            <Select
              placeholder="状态"
              allowClear
              style={{ width: 120 }}
              onChange={setFilterStatus}
              value={filterStatus}
            >
              <Option value="pending">待核实</Option>
              <Option value="investigating">核查中</Option>
              <Option value="verified">已核实</Option>
              <Option value="closed">已结案</Option>
            </Select>
            <Select
              placeholder="风险等级"
              allowClear
              style={{ width: 120 }}
              onChange={setFilterRisk}
              value={filterRisk}
            >
              <Option value="high">高风险</Option>
              <Option value="medium">中风险</Option>
              <Option value="low">低风险</Option>
            </Select>
            <Select
              placeholder="问责"
              allowClear
              style={{ width: 120 }}
              onChange={setFilterAccountability}
              value={filterAccountability}
            >
              <Option value="pending">待处理</Option>
              <Option value="processing">处理中</Option>
              <Option value="completed">已完成</Option>
              <Option value="none">不涉及</Option>
            </Select>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedClue(null);
                editForm.resetFields();
                editForm.setFieldsValue({ riskLevel: 'medium', status: 'pending', priority: 'normal', accountabilityStatus: 'none', tags: [] });
                setEditVisible(true);
              }}
            >
              登记线索
            </Button>
          </Space>
        }
      >
        <Table<RiskClue>
          size="small"
          rowKey="id"
          columns={columns}
          dataSource={filteredClues}
          scroll={{ x: 1600 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: t => `共 ${t} 条线索`,
            pageSize: 10
          }}
          onRow={record => ({
            onClick: () => { setSelectedClue(record); setDetailVisible(true); },
            style: { cursor: 'pointer' }
          })}
        />
      </Card>

      <Drawer
        title={
          <Space>
            <EyeOutlined />
            线索详情
            {selectedClue && <Tag color={riskLevelColor[selectedClue.riskLevel]}>{riskLevelText[selectedClue.riskLevel]}</Tag>}
          </Space>
        }
        width={860}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        extra={
          selectedClue && (
            <Space>
              <Button icon={<EditOutlined />} onClick={() => { editForm.setFieldsValue({ ...selectedClue, tags: selectedClue.tags, relatedRecordIds: selectedClue.relatedRecordIds }); setEditVisible(true); }}>编辑</Button>
              {selectedClue.status !== 'verified' && selectedClue.status !== 'closed' && (
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setConclusionVisible(true)}>登记结论</Button>
              )}
            </Space>
          )
        }
      >
        {selectedClue && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Space size={[8, 8]} wrap>
              <Tag color={caseStatusConfig[selectedClue.status].color} icon={caseStatusConfig[selectedClue.status].icon} style={{ margin: 0 }}>
                {caseStatusConfig[selectedClue.status].text}
              </Tag>
              <Tag color={priorityConfig[selectedClue.priority].color}>
                优先级：{priorityConfig[selectedClue.priority].text}
              </Tag>
              <Tag color={accountabilityConfig[selectedClue.accountabilityStatus].color}>
                问责：{accountabilityConfig[selectedClue.accountabilityStatus].text}
              </Tag>
              {selectedClue.tags.map(t => <Tag key={t}>{t}</Tag>)}
            </Space>

            <Descriptions title="基本信息" bordered column={2} size="small">
              <Descriptions.Item label="线索编号">{selectedClue.clueNo}</Descriptions.Item>
              <Descriptions.Item label="发现时间">{selectedClue.discoveredTime}</Descriptions.Item>
              <Descriptions.Item label="线索类型">{selectedClue.type}</Descriptions.Item>
              <Descriptions.Item label="发现方式">{selectedClue.discoveredBy}</Descriptions.Item>
              <Descriptions.Item label="涉及单位" span={2}>{selectedClue.unitName}</Descriptions.Item>
              <Descriptions.Item label="涉及人员">{selectedClue.personnelName || '-'}</Descriptions.Item>
              <Descriptions.Item label="核查人员">{selectedClue.investigator || '-'}</Descriptions.Item>
            </Descriptions>

            <Card size="small" title={<Space><AlertOutlined style={{ color: '#ff4d4f' }} /> 线索描述</Space>}>
              <Paragraph>{selectedClue.description}</Paragraph>
            </Card>

            {selectedClue.conclusion && (
              <Card size="small" title={<Space><CheckCircleOutlined style={{ color: '#52c41a' }} /> 核查结论</Space>} type="inner">
                <Descriptions column={2} size="small" bordered={false}>
                  <Descriptions.Item label="结论时间">{selectedClue.conclusionTime}</Descriptions.Item>
                  <Descriptions.Item label="状态">{caseStatusConfig[selectedClue.status].text}</Descriptions.Item>
                </Descriptions>
                <Alert
                  type={selectedClue.status === 'closed' ? 'success' : 'info'}
                  showIcon
                  message={selectedClue.conclusion}
                  style={{ marginTop: 8 }}
                />
              </Card>
            )}

            {selectedClue.accountabilityStatus !== 'none' && (
              <Card size="small" title={<Space><SafetyOutlined style={{ color: '#faad14' }} /> 问责处理情况</Space>}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Tag color={accountabilityConfig[selectedClue.accountabilityStatus].color} style={{ alignSelf: 'flex-start' }}>
                    {accountabilityConfig[selectedClue.accountabilityStatus].text}
                  </Tag>
                  {selectedClue.accountabilityResult && (
                    <Alert
                      type="warning"
                      showIcon
                      message={selectedClue.accountabilityResult}
                    />
                  )}
                </Space>
              </Card>
            )}

            <Card size="small" title={<Space><FileSearchOutlined /> 关联调证记录 ({relatedRecords.length} 条)</Space>}>
              {relatedRecords.length > 0 ? (
                <Table
                  size="small"
                  rowKey="id"
                  pagination={false}
                  dataSource={relatedRecords}
                  scroll={{ x: 800 }}
                  columns={[
                    { title: '时间', dataIndex: 'callTime', width: 160 },
                    { title: '经办人', dataIndex: 'personnelName', width: 100 },
                    { title: '事项', dataIndex: 'matterName' },
                    { title: '证照', dataIndex: 'certType', width: 100 },
                    {
                      title: '风险',
                      key: 'risk',
                      width: 100,
                      render: (_, r) => <Badge color={riskLevelColor[r.riskLevel]} text={riskLevelText[r.riskLevel]} />
                    }
                  ]}
                />
              ) : (
                <Empty description="暂无关联记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>

            <Card size="small" title={<Space><HistoryOutlined /> 处理时间线</Space>}>
              <Timeline
                items={[
                  {
                    color: 'blue',
                    dot: <AlertOutlined />,
                    children: (
                      <div>
                        <Text strong>线索发现</Text>
                        <div style={{ color: '#999', fontSize: 12 }}>{selectedClue.discoveredTime} · {selectedClue.discoveredBy}</div>
                        <div style={{ marginTop: 4 }}>{selectedClue.title}</div>
                      </div>
                    )
                  },
                  ...(selectedClue.investigator ? [
                    {
                      color: 'cyan',
                      dot: <SearchOutlined />,
                      children: (
                        <div>
                          <Text strong>指派核查</Text>
                          <div style={{ marginTop: 4 }}>核查组：{selectedClue.investigator}</div>
                        </div>
                      )
                    }
                  ] : []),
                  ...(selectedClue.conclusion ? [
                    {
                      color: selectedClue.status === 'closed' ? 'green' : 'orange',
                      dot: <CheckCircleOutlined />,
                      children: (
                        <div>
                          <Text strong>核查结论登记</Text>
                          <div style={{ color: '#999', fontSize: 12 }}>{selectedClue.conclusionTime}</div>
                          <div style={{ marginTop: 4 }}>{selectedClue.conclusion}</div>
                        </div>
                      )
                    }
                  ] : []),
                  ...(selectedClue.accountabilityResult ? [
                    {
                      color: 'purple',
                      dot: <SafetyOutlined />,
                      children: (
                        <div>
                          <Text strong>问责处理</Text>
                          <div style={{ color: '#999', fontSize: 12 }}>{accountabilityConfig[selectedClue.accountabilityStatus].text}</div>
                          <div style={{ marginTop: 4 }}>{selectedClue.accountabilityResult}</div>
                        </div>
                      )
                    }
                  ] : [])
                ]}
              />
            </Card>
          </Space>
        )}
      </Drawer>

      <Modal
        title={selectedClue ? <Space><EditOutlined /> 编辑线索信息</Space> : <Space><PlusOutlined /> 登记新线索</Space>}
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        onOk={() => editForm.submit()}
        width={720}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
          initialValues={{ riskLevel: 'medium', status: 'pending', priority: 'normal', accountabilityStatus: 'none', tags: [] }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="线索标题" name="title" rules={[{ required: true }]}>
                <Input placeholder="请输入线索标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="线索编号" name="clueNo" rules={[{ required: true }]}>
                <Input placeholder="如：XZ-2026-06-001" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
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
            <Col span={8}>
              <Form.Item label="风险等级" name="riskLevel" rules={[{ required: true }]}>
                <Radio.Group>
                  <Radio.Button value="high"><span style={{ color: '#ff4d4f' }}>高</span></Radio.Button>
                  <Radio.Button value="medium"><span style={{ color: '#faad14' }}>中</span></Radio.Button>
                  <Radio.Button value="low"><span style={{ color: '#52c41a' }}>低</span></Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="优先级" name="priority" rules={[{ required: true }]}>
                <Radio.Group>
                  <Radio.Button value="urgent">紧急</Radio.Button>
                  <Radio.Button value="high">高</Radio.Button>
                  <Radio.Button value="normal">普通</Radio.Button>
                  <Radio.Button value="low">低</Radio.Button>
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
                <Select showSearch optionFilterProp="label" allowClear placeholder="可空">
                  {personnel.map(p => <Option key={p.id} value={p.id} label={p.name}>{p.name} - {p.unitName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="状态" name="status" rules={[{ required: true }]}>
                <Select>
                  <Option value="pending">待核实</Option>
                  <Option value="investigating">核查中</Option>
                  <Option value="verified">已核实</Option>
                  <Option value="closed">已结案</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="核查人员" name="investigator">
                <Input placeholder="如：巡察一组" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="问责状态" name="accountabilityStatus" rules={[{ required: true }]}>
                <Select>
                  <Option value="none">不涉及</Option>
                  <Option value="pending">待处理</Option>
                  <Option value="processing">处理中</Option>
                  <Option value="completed">已完成</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="标签" name="tags">
            <Select mode="tags" placeholder="按回车添加标签" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="关联记录ID" name="relatedRecordIds">
            <Select mode="tags" placeholder="选择或输入记录ID" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="详细描述" name="description" rules={[{ required: true }]}>
            <TextArea rows={4} showCount maxLength={1000} placeholder="请详细描述异常情况、涉及范围、初步判断等" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<Space><CheckCircleOutlined /> 登记核查结论</Space>}
        open={conclusionVisible}
        onCancel={() => setConclusionVisible(false)}
        onOk={() => conclusionForm.submit()}
        destroyOnClose
      >
        <Form
          form={conclusionForm}
          layout="vertical"
          onFinish={handleConclusionSubmit}
          initialValues={{ status: 'verified' }}
        >
          <Form.Item label="处理状态" name="status" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio.Button value="investigating">继续核查</Radio.Button>
              <Radio.Button value="verified">已核实</Radio.Button>
              <Radio.Button value="closed">予以结案</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="核查结论" name="conclusion" rules={[{ required: true, message: '请输入核查结论' }]}>
            <TextArea rows={5} showCount maxLength={500} placeholder="请详细填写核查过程、核实情况、发现问题等" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<Space><SafetyOutlined /> 问责处理信息</Space>}
        open={accountabilityVisible}
        onCancel={() => setAccountabilityVisible(false)}
        onOk={() => accountabilityForm.submit()}
        destroyOnClose
      >
        <Form
          form={accountabilityForm}
          layout="vertical"
          onFinish={handleAccountabilitySubmit}
          initialValues={{ accountabilityStatus: selectedClue?.accountabilityStatus || 'none' }}
        >
          <Form.Item label="问责状态" name="accountabilityStatus" rules={[{ required: true }]}>
            <Select>
              <Option value="none">不涉及问责</Option>
              <Option value="pending">待启动问责</Option>
              <Option value="processing">问责处理中</Option>
              <Option value="completed">已完成问责</Option>
            </Select>
          </Form.Item>
          <Form.Item label="处理结果说明" name="accountabilityResult">
            <TextArea rows={5} showCount maxLength={500} placeholder="请填写具体问责方式、处分决定等" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
