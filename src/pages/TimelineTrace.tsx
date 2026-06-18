import React, { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  Space,
  Table,
  Tag,
  Timeline,
  Descriptions,
  Drawer,
  Typography,
  Divider,
  Tooltip,
  Progress,
  Empty,
  Alert,
  Statistic,
  List,
  Badge,
  Tabs,
  Select
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  LinkOutlined,
  ExportOutlined
} from '@ant-design/icons';
import { useAuditStore } from '../store/useAuditStore';
import { EvidenceChain, EvidenceStep, CallRecord } from '../types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const actionTypeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  submit: { label: '申请提交', color: 'blue', icon: <FileTextOutlined /> },
  approve: { label: '审批通过', color: 'green', icon: <CheckCircleOutlined /> },
  callCert: { label: '调证查询', color: 'cyan', icon: <SafetyCertificateOutlined /> },
  download: { label: '证照下载', color: 'purple', icon: <FileTextOutlined /> },
  sign: { label: '审核签字', color: 'geekblue', icon: <UserOutlined /> },
  complete: { label: '办件完成', color: 'green', icon: <CheckCircleOutlined /> },
  complain: { label: '投诉反馈', color: 'red', icon: <AlertOutlined /> }
};

const authCheckConfig: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
  matched: { text: '授权匹配', color: 'green', icon: <CheckCircleOutlined /> },
  mismatched: { text: '授权不匹配', color: 'red', icon: <CloseCircleOutlined /> },
  none: { text: '无授权记录', color: 'orange', icon: <WarningOutlined /> }
};

export default function TimelineTrace() {
  const { evidenceChains, callRecords, complaintRecords, units } = useAuditStore();
  const [selectedChain, setSelectedChain] = useState<EvidenceChain | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterUnit, setFilterUnit] = useState<string | undefined>();
  const [filterHasRisk, setFilterHasRisk] = useState<boolean | null>(null);
  const [activeTabKey, setActiveTabKey] = useState('chain');

  const filteredChains = useMemo(() => {
    return evidenceChains.filter(chain => {
      if (filterUnit && chain.unitId !== filterUnit) return false;
      if (filterHasRisk === true && chain.riskPoints.length === 0) return false;
      if (filterHasRisk === false && chain.riskPoints.length > 0) return false;
      if (searchText) {
        const text = searchText.toLowerCase();
        return (
          chain.transactionId.toLowerCase().includes(text) ||
          chain.businessNo?.toLowerCase().includes(text) ||
          chain.applicantName?.toLowerCase().includes(text) ||
          chain.matterName.toLowerCase().includes(text)
        );
      }
      return true;
    });
  }, [evidenceChains, searchText, filterUnit, filterHasRisk]);

  const chainColumns: ColumnsType<EvidenceChain> = [
    {
      title: '事务编号',
      dataIndex: 'transactionId',
      key: 'transactionId',
      width: 180,
      render: v => <Text code copyable>{v}</Text>
    },
    {
      title: '业务单号',
      dataIndex: 'businessNo',
      key: 'businessNo',
      width: 160,
      render: v => v || '-'
    },
    {
      title: '申请人',
      dataIndex: 'applicantName',
      key: 'applicantName',
      width: 100
    },
    {
      title: '办理事项',
      dataIndex: 'matterName',
      key: 'matterName',
      width: 160
    },
    {
      title: '办理单位',
      dataIndex: 'unitName',
      key: 'unitName',
      width: 200,
      ellipsis: true
    },
    {
      title: '链路状态',
      key: 'status',
      width: 100,
      render: (_, r) => r.isComplete
        ? <Tag icon={<CheckCircleOutlined />} color="green">完整</Tag>
        : <Tag icon={<WarningOutlined />} color="orange">中断</Tag>
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 180
    },
    {
      title: '耗时',
      key: 'duration',
      width: 100,
      render: (_, r) => {
        const mins = Math.floor(r.totalDuration / 60);
        const secs = r.totalDuration % 60;
        return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`;
      }
    },
    {
      title: '风险点',
      key: 'risks',
      width: 100,
      render: (_, r) => r.riskPoints.length > 0
        ? <Badge count={r.riskPoints.length} offset={[0, 0]}><Tag color="red">异常</Tag></Badge>
        : <Tag color="green">正常</Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedChain(r); setDrawerVisible(true); }}>追踪</Button>
        </Space>
      )
    }
  ];

  const sameCertTimeline = useMemo(() => {
    const WINDOW_MS = 2 * 60 * 60 * 1000; // 2小时窗口
    const certMap: Record<string, CallRecord[]> = {};
    callRecords.forEach(r => {
      if (!certMap[r.certNo]) certMap[r.certNo] = [];
      certMap[r.certNo].push(r);
    });

    // 对每张证照，用滑窗找出多部门短时连续查询的分组
    const groups: Array<{
      groupKey: string;
      certNo: string;
      certType: string;
      holderName: string;
      records: CallRecord[];
      deptCount: number;
      personnelCount: number;
      firstTime: string;
      lastTime: string;
      timeSpanMinutes: number;
      deptNames: string[];
    }> = [];

    let groupIdx = 0;
    Object.entries(certMap).forEach(([certNo, list]) => {
      if (list.length < 2) return;
      const sorted = list.sort((a, b) => new Date(a.callTime).getTime() - new Date(b.callTime).getTime());
      const n = sorted.length;
      let left = 0;
      let lastGroupedRight = -1;

      for (let right = 0; right < n; right++) {
        while (left < right && new Date(sorted[right].callTime).getTime() - new Date(sorted[left].callTime).getTime() > WINDOW_MS) {
          left++;
        }
        const window = sorted.slice(left, right + 1);
        const unitSet = new Set(window.map(r => r.unitName));
        // 仅窗口内部门数 >= 2（跨部门）才计入，排除同一部门自己多次查询的情况
        if (unitSet.size >= 2 && right >= lastGroupedRight + 1) {
          const t1 = new Date(window[0].callTime).getTime();
          const t2 = new Date(window[window.length - 1].callTime).getTime();
          groups.push({
            groupKey: `${certNo}-${groupIdx++}`,
            certNo,
            certType: window[0].certType,
            holderName: window[0].holderName || '-',
            records: window,
            deptCount: unitSet.size,
            personnelCount: new Set(window.map(r => r.personnelName)).size,
            firstTime: window[0].callTime,
            lastTime: window[window.length - 1].callTime,
            timeSpanMinutes: Math.max(1, Math.round((t2 - t1) / 60000)),
            deptNames: Array.from(unitSet)
          });
          lastGroupedRight = right;
        }
      }
    });

    return groups
      .sort((a, b) => {
        // 多部门 + 调用次数多的排前
        const scoreA = (a.deptCount >= 2 ? 100 : 0) + a.records.length * 10;
        const scoreB = (b.deptCount >= 2 ? 100 : 0) + b.records.length * 10;
        return scoreB - scoreA;
      })
      .slice(0, 10);
  }, [callRecords]);

  const renderChainStep = (step: EvidenceStep) => {
    const config = actionTypeConfig[step.actionType] || {
      label: step.actionType,
      color: 'default',
      icon: <FileTextOutlined />
    };
    const highlight = step.authorizationCheck === 'mismatched' || step.authorizationCheck === 'none';

    return (
      <Timeline.Item
        key={step.stepNo}
        color={highlight ? 'red' : config.color === 'green' ? 'green' : 'blue'}
        dot={React.cloneElement(config.icon as React.ReactElement, { style: { fontSize: 16 } })}
        className={highlight ? 'timeline-item-highlight' : ''}
      >
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Tag color={config.color} icon={config.icon} style={{ margin: 0 }}>
                步骤{step.stepNo}: {config.label}
              </Tag>
              <Text strong>{step.stepName}</Text>
            </Space>
            <Space>
              <ClockCircleOutlined style={{ color: '#999' }} />
              <Text type="secondary">{step.actionTime}</Text>
            </Space>
          </Space>

          <Space size={[8, 4]} wrap>
            {step.operatorName && (
              <Tag icon={<UserOutlined />}>操作人：{step.operatorName}</Tag>
            )}
            {step.unitName && (
              <Tag icon={<TeamOutlined />} color="purple">{step.unitName}</Tag>
            )}
            {step.certType && (
              <Tag icon={<SafetyCertificateOutlined />} color="cyan">证照：{step.certType}</Tag>
            )}
            {step.authorizationCheck && (
              <Tooltip title={authCheckConfig[step.authorizationCheck].text}>
                <Tag
                  color={authCheckConfig[step.authorizationCheck].color}
                  icon={authCheckConfig[step.authorizationCheck].icon}
                >
                  {authCheckConfig[step.authorizationCheck].text}
                </Tag>
              </Tooltip>
            )}
            {step.ip && (
              <Tag color="blue">IP：{step.ip}</Tag>
            )}
          </Space>

          {step.remark && (
            <Alert
              type={step.authorizationCheck === 'mismatched' || step.authorizationCheck === 'none' ? 'error' : 'info'}
              showIcon
              message={step.remark}
              style={{ marginTop: 4 }}
            />
          )}
        </Space>
      </Timeline.Item>
    );
  };

  const totalChains = evidenceChains.length;
  const completeChains = evidenceChains.filter(c => c.isComplete).length;
  const riskChains = evidenceChains.filter(c => c.riskPoints.length > 0).length;
  const totalSteps = evidenceChains.reduce((s, c) => s + c.steps.length, 0);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-blue">
            <Statistic
              title={<span style={{ color: '#fff', opacity: 0.9 }}>证据链总数</span>}
              value={totalChains}
              suffix="条"
              valueStyle={{ color: '#fff' }}
              prefix={<LinkOutlined />}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-green">
            <Statistic
              title={<span style={{ color: '#fff', opacity: 0.9 }}>完整链路</span>}
              value={completeChains}
              valueStyle={{ color: '#fff' }}
              prefix={<CheckCircleOutlined />}
              suffix={` / ${totalChains} 条`}
            />
            <Progress
              percent={Math.round(completeChains / totalChains * 100)}
              size="small"
              strokeColor="#fff"
              trailColor="rgba(255,255,255,0.3)"
              style={{ marginTop: 8 }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-red">
            <Statistic
              title={<span style={{ color: '#fff', opacity: 0.9 }}>含风险链路</span>}
              value={riskChains}
              suffix="条"
              valueStyle={{ color: '#fff' }}
              prefix={<WarningOutlined />}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-orange">
            <Statistic
              title={<span style={{ color: '#fff', opacity: 0.9 }}>总节点数</span>}
              value={totalSteps}
              suffix="个"
              valueStyle={{ color: '#fff' }}
              prefix={<ClockCircleOutlined />}
            />
          </div>
        </Col>
      </Row>

      <Card size="small">
        <Tabs
          activeKey={activeTabKey}
          onChange={setActiveTabKey}
          items={[
            {
              key: 'chain',
              label: (
                <Space>
                  <LinkOutlined />
                  办件用证链路
                </Space>
              )
            },
            {
              key: 'cert-trace',
              label: (
                <Space>
                  <SafetyCertificateOutlined />
                  证照流转追踪
                </Space>
              )
            },
            {
              key: 'complaint-trace',
              label: (
                <Space>
                  <AlertOutlined />
                  投诉线索锁定
                </Space>
              )
            }
          ]}
        />

        {activeTabKey === 'chain' && (
          <Space direction="vertical" size={12} style={{ width: '100%', marginTop: 12 }}>
            <Row gutter={12}>
              <Col xs={24} md={8}>
                <Search
                  placeholder="搜索事务号/业务单号/申请人/事项"
                  allowClear
                  enterButton={<><SearchOutlined /> 查询</>}
                  size="middle"
                  onSearch={setSearchText}
                />
              </Col>
              <Col xs={24} md={6}>
                <Select
                  placeholder="筛选办理单位"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={setFilterUnit}
                  showSearch
                  optionFilterProp="label"
                >
                  {units.map(u => <Option key={u.id} value={u.id} label={u.name}>{u.name}</Option>)}
                </Select>
              </Col>
              <Col xs={24} md={6}>
                <Select
                  placeholder="链路风险状态"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={setFilterHasRisk}
                >
                  <Option value={true}>存在风险</Option>
                  <Option value={false}>正常无风险</Option>
                </Select>
              </Col>
              <Col xs={24} md={4}>
                <Button icon={<ReloadOutlined />} onClick={() => { setSearchText(''); setFilterUnit(undefined); setFilterHasRisk(null); }}>重置</Button>
              </Col>
            </Row>

            <Table<EvidenceChain>
              size="small"
              rowKey="id"
              columns={chainColumns}
              dataSource={filteredChains}
              scroll={{ x: 1400 }}
              pagination={{ showSizeChanger: true, showTotal: t => `共 ${t} 条证据链`, pageSize: 10 }}
              locale={{ emptyText: <Empty description="未找到匹配的用证链路" /> }}
              onRow={record => ({
                onClick: () => { setSelectedChain(record); setDrawerVisible(true); },
                style: { cursor: 'pointer' }
              })}
            />
          </Space>
        )}

        {activeTabKey === 'cert-trace' && (
          <Space direction="vertical" size={16} style={{ width: '100%', marginTop: 12 }}>
            <Alert
              type="info"
              showIcon
              message="同一证照被多部门/多人员查询分析"
              description="以下证照在短时间内被多个部门或多名工作人员连续查询，可能存在异常，请逐一核实。"
            />

            <Row gutter={[16, 16]}>
              {sameCertTimeline.map((item) => {
                const hasHighRisk = item.records.some(r => r.riskLevel === 'high');
                const multiDept = item.deptCount >= 2;

                return (
                  <Col xs={24} lg={12} key={item.groupKey}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <SafetyCertificateOutlined style={{ color: hasHighRisk || multiDept ? '#ff4d4f' : '#1677ff' }} />
                          <Text strong>{item.certType}</Text>
                          <Text type="secondary" code copyable>
                            {item.certNo.slice(0, 4)}****{item.certNo.slice(-4)}
                          </Text>
                          <Badge count={item.records.length} offset={[0, 0]} showZero>
                            {hasHighRisk && <Tag color="red">高风险</Tag>}
                            {multiDept && <Tag color="orange">多部门交叉</Tag>}
                          </Badge>
                        </Space>
                      }
                      extra={<Text type="secondary">持有人：{item.holderName}</Text>}
                    >
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Space wrap size={[8, 4]}>
                          <Tag color="blue">{item.deptCount} 个部门</Tag>
                          <Tag color="purple">{item.personnelCount} 名经办人</Tag>
                          <Tag color="cyan">时间跨度：{item.timeSpanMinutes >= 60 ? `${Math.floor(item.timeSpanMinutes / 60)}时${item.timeSpanMinutes % 60}分` : `${item.timeSpanMinutes}分钟`}</Tag>
                        </Space>
                        <Space wrap size={[4, 4]} style={{ fontSize: 12 }}>
                          <Text type="secondary">首次查询：{item.firstTime}</Text>
                          <Divider type="vertical" />
                          <Text type="secondary">末次查询：{item.lastTime}</Text>
                        </Space>
                        {multiDept && (
                          <Space wrap size={[4, 4]}>
                            <Text type="secondary" style={{ fontSize: 12 }}>涉及部门：</Text>
                            {item.deptNames.map(d => <Tag key={d} color="purple" style={{ fontSize: 12 }}>{d}</Tag>)}
                          </Space>
                        )}

                        <Divider style={{ margin: '8px 0' }} />

                        <Timeline
                          style={{ paddingTop: 4 }}
                          items={item.records.map((r, idx) => ({
                            color: r.riskLevel === 'high' ? 'red' : r.riskLevel === 'medium' ? 'orange' : 'blue',
                            dot: <ClockCircleOutlined />,
                            children: (
                              <Space direction="vertical" size={2}>
                                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                  <Text strong>{r.unitName}</Text>
                                  <Text type="secondary" style={{ fontSize: 12 }}>{r.callTime}</Text>
                                </Space>
                                <Space size={[4, 4]} wrap>
                                  <Tag color="cyan" style={{ margin: 0 }}>@{r.personnelName}</Tag>
                                  <Tag color="purple">{r.matterName}</Tag>
                                  {r.riskLevel !== 'low' && (
                                    <Tag color={r.riskLevel === 'high' ? 'red' : 'orange'}>
                                      {r.riskLevel === 'high' ? '高风险' : '中风险'}
                                    </Tag>
                                  )}
                                  {!r.hasApproval && <Tag color="red">无审批</Tag>}
                                  {r.isComplained && <Tag color="red">被投诉</Tag>}
                                </Space>
                              </Space>
                            )
                          }))}
                        />
                      </Space>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Space>
        )}

        {activeTabKey === 'complaint-trace' && (
          <Space direction="vertical" size={16} style={{ width: '100%', marginTop: 12 }}>
            <Alert
              type="warning"
              showIcon
              message="投诉线索与用证记录关联追踪"
              description="将投诉件与对应办件的用证链路进行关联，辅助核查人员快速定位问题环节。"
            />

            <List
              itemLayout="vertical"
              dataSource={complaintRecords}
              renderItem={complaint => {
                const relatedCalls = callRecords.filter(r => r.transactionId === complaint.relatedTransactionId || r.isComplained);
                const relatedChain = evidenceChains.find(c => c.transactionId === complaint.relatedTransactionId);

                return (
                  <List.Item>
                    <Card size="small">
                      <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <Space style={{ width: '100%', justifyContent: 'space-between' }} align="start">
                          <Space direction="vertical" size={4}>
                            <Space>
                              <Tag color="red" style={{ margin: 0 }}>投诉编号：{complaint.complaintNo}</Tag>
                              <Tag color="purple">{complaint.complaintType}</Tag>
                              <Tag color={
                                complaint.status === 'pending' ? 'default' :
                                complaint.status === 'processing' ? 'processing' :
                                complaint.status === 'replied' ? 'success' : 'warning'
                              }>
                                {
                                  complaint.status === 'pending' ? '待处理' :
                                  complaint.status === 'processing' ? '处理中' :
                                  complaint.status === 'replied' ? '已回复' : '已关闭'
                                }
                              </Tag>
                            </Space>
                            <Title level={5} style={{ margin: '4px 0 0' }}>{complaint.complaintContent}</Title>
                          </Space>
                          <Text type="secondary">{complaint.complaintTime}</Text>
                        </Space>

                        <Descriptions size="small" column={2} bordered>
                          <Descriptions.Item label="投诉人">{complaint.complainantName}</Descriptions.Item>
                          <Descriptions.Item label="联系电话">{complaint.complainantPhone}</Descriptions.Item>
                          <Descriptions.Item label="被投诉单位">{complaint.relatedUnitName || '-'}</Descriptions.Item>
                          <Descriptions.Item label="被投诉人员">{complaint.relatedPersonnelName || '-'}</Descriptions.Item>
                          <Descriptions.Item label="涉及证照">
                            <Space size={[4, 4]} wrap>
                              {complaint.certInvolved?.map(c => <Tag key={c} color="cyan">{c}</Tag>)}
                            </Space>
                          </Descriptions.Item>
                          <Descriptions.Item label="关联事务">{complaint.relatedTransactionId || '未关联'}</Descriptions.Item>
                        </Descriptions>

                        {complaint.handler && (
                          <Descriptions size="small" column={2} bordered>
                            <Descriptions.Item label="处理人">{complaint.handler}</Descriptions.Item>
                            <Descriptions.Item label="回复时间">{complaint.replyTime || '-'}</Descriptions.Item>
                            {complaint.replyContent && (
                              <Descriptions.Item label="回复内容" span={2}>{complaint.replyContent}</Descriptions.Item>
                            )}
                          </Descriptions>
                        )}

                        <Space direction="vertical" size={8}>
                          <Text strong>关联用证记录 ({relatedCalls.length} 条)</Text>
                          {relatedCalls.length > 0 ? (
                            <Table
                              size="small"
                              rowKey="id"
                              pagination={false}
                              dataSource={relatedCalls}
                              columns={[
                                { title: '时间', dataIndex: 'callTime', width: 180 },
                                { title: '单位', dataIndex: 'unitName' },
                                { title: '经办人', dataIndex: 'personnelName', width: 100 },
                                { title: '事项', dataIndex: 'matterName' },
                                { title: '证照', dataIndex: 'certType', width: 100 },
                                { title: '风险', key: 'risk', width: 100, render: (_, r) => <Badge color={r.riskLevel === 'high' ? 'red' : r.riskLevel === 'medium' ? 'orange' : 'green'} text={r.riskLevel === 'low' ? '正常' : r.riskLevel === 'medium' ? '中风险' : '高风险'} /> }
                              ]}
                            />
                          ) : (
                            <Empty description="暂未关联用证记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                          )}

                          {relatedChain && (
                            <Button type="primary" icon={<LinkOutlined />} onClick={() => { setSelectedChain(relatedChain); setDrawerVisible(true); }}>
                              查看完整用证链路
                            </Button>
                          )}
                        </Space>
                      </Space>
                    </Card>
                  </List.Item>
                );
              }}
            />
          </Space>
        )}
      </Card>

      <Drawer
        title={
          <Space>
            <LinkOutlined />
            用证链路还原 - 证据链追踪
          </Space>
        }
        width={860}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        extra={
          <Space>
            <Button icon={<ExportOutlined />}>导出证据</Button>
          </Space>
        }
      >
        {selectedChain && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {selectedChain.riskPoints.length > 0 && (
              <Alert
                type="error"
                showIcon
                message="链路存在风险点"
                description={
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {selectedChain.riskPoints.map((rp, i) => <li key={i}>{rp}</li>)}
                  </ul>
                }
              />
            )}

            <Descriptions title="链路概要" bordered column={2} size="small">
              <Descriptions.Item label="事务ID">{selectedChain.transactionId}</Descriptions.Item>
              <Descriptions.Item label="业务单号">{selectedChain.businessNo || '-'}</Descriptions.Item>
              <Descriptions.Item label="申请人">{selectedChain.applicantName || '-'}</Descriptions.Item>
              <Descriptions.Item label="办理事项">{selectedChain.matterName}</Descriptions.Item>
              <Descriptions.Item label="办理单位">{selectedChain.unitName}</Descriptions.Item>
              <Descriptions.Item label="链路完整性">
                {selectedChain.isComplete ? <Tag color="green">完整</Tag> : <Tag color="orange">中断</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">{selectedChain.startTime}</Descriptions.Item>
              <Descriptions.Item label="结束时间">{selectedChain.endTime}</Descriptions.Item>
              <Descriptions.Item label="总耗时" span={2}>
                {(() => {
                  const d = dayjs.duration(selectedChain.totalDuration, 'seconds');
                  const hours = Math.floor(d.asHours());
                  const mins = d.minutes();
                  const secs = d.seconds();
                  return `${hours > 0 ? hours + '小时' : ''}${mins > 0 ? mins + '分钟' : ''}${secs}秒`;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="节点数量" span={2}>{selectedChain.steps.length} 个操作步骤</Descriptions.Item>
            </Descriptions>

            <Card
              size="small"
              title={
                <Space>
                  <TimelineOutlined />
                  时序追踪图
                </Space>
              }
              className="evidence-chain"
            >
              <Timeline mode="left" style={{ padding: 16 }}>
                {selectedChain.steps.map(renderChainStep)}
              </Timeline>
            </Card>

            <Descriptions title="授权时间比对" bordered column={2} size="small">
              {selectedChain.steps.filter(s => s.authorizationCheck).map(s => (
                <Descriptions.Item
                  key={s.stepNo}
                  label={
                    <Space>
                      步骤{s.stepNo}：{s.certType}
                      <Tag color={authCheckConfig[s.authorizationCheck!].color}>
                        {authCheckConfig[s.authorizationCheck!].text}
                      </Tag>
                    </Space>
                  }
                  span={2}
                >
                  操作时间：{s.actionTime}
                </Descriptions.Item>
              ))}
              {selectedChain.steps.filter(s => s.authorizationCheck).length === 0 && (
                <Descriptions.Item span={2}>本链路无授权校验节点</Descriptions.Item>
              )}
            </Descriptions>
          </Space>
        )}
      </Drawer>
    </Space>
  );
}

function TimelineOutlined(props: any) {
  return <ClockCircleOutlined {...props} />;
}
