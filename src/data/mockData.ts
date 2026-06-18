import {
  Unit,
  Personnel,
  Matter,
  CertRecord,
  CallRecord,
  RiskClue,
  EvidenceChain,
  ComplaintRecord,
  UnitComplianceMetrics,
  DailyStats,
  RiskLevel
} from '../types';

const units: Unit[] = [
  {
    id: 'U001',
    name: '市市场监督管理局',
    category: '市场监管',
    level: '正处级',
    contactPerson: '张主任',
    contactPhone: '020-88880001',
    address: '市政中心A座5楼',
    totalCalls: 12580,
    riskScore: 72,
    complianceRate: 88.5,
    abnormalCount: 145
  },
  {
    id: 'U002',
    name: '市公安局出入境管理支队',
    category: '公安',
    level: '副处级',
    contactPerson: '李支队',
    contactPhone: '020-88880002',
    address: '市政中心B座3楼',
    totalCalls: 8920,
    riskScore: 45,
    complianceRate: 95.2,
    abnormalCount: 42
  },
  {
    id: 'U003',
    name: '市人力资源和社会保障局',
    category: '人社',
    level: '正处级',
    contactPerson: '王局长',
    contactPhone: '020-88880003',
    address: '市政中心C座8楼',
    totalCalls: 15340,
    riskScore: 68,
    complianceRate: 89.8,
    abnormalCount: 158
  },
  {
    id: 'U004',
    name: '市住房和城乡建设局',
    category: '住建',
    level: '正处级',
    contactPerson: '赵主任',
    contactPhone: '020-88880004',
    address: '市政中心D座6楼',
    totalCalls: 6720,
    riskScore: 85,
    complianceRate: 76.5,
    abnormalCount: 256
  },
  {
    id: 'U005',
    name: '市卫生健康委员会',
    category: '卫健',
    level: '正处级',
    contactPerson: '刘主任',
    contactPhone: '020-88880005',
    address: '市政中心E座10楼',
    totalCalls: 9870,
    riskScore: 52,
    complianceRate: 93.5,
    abnormalCount: 63
  },
  {
    id: 'U006',
    name: '市教育局',
    category: '教育',
    level: '正处级',
    contactPerson: '陈主任',
    contactPhone: '020-88880006',
    address: '市政中心F座7楼',
    totalCalls: 4560,
    riskScore: 38,
    complianceRate: 96.8,
    abnormalCount: 25
  },
  {
    id: 'U007',
    name: '市税务局',
    category: '税务',
    level: '正处级',
    contactPerson: '周局长',
    contactPhone: '020-88880007',
    address: '市政中心G座12楼',
    totalCalls: 22150,
    riskScore: 62,
    complianceRate: 91.2,
    abnormalCount: 195
  },
  {
    id: 'U008',
    name: '市民政局',
    category: '民政',
    level: '正处级',
    contactPerson: '孙主任',
    contactPhone: '020-88880008',
    address: '市政中心H座9楼',
    totalCalls: 3890,
    riskScore: 42,
    complianceRate: 94.6,
    abnormalCount: 31
  }
];

const personnel: Personnel[] = [
  { id: 'P001', name: '张明', unitId: 'U001', unitName: '市市场监督管理局', position: '审批科科长', role: '审批员', totalCalls: 856, riskCount: 12 },
  { id: 'P002', name: '李红', unitId: 'U001', unitName: '市市场监督管理局', position: '受理员', role: '受理员', totalCalls: 1520, riskCount: 28 },
  { id: 'P003', name: '王强', unitId: 'U001', unitName: '市市场监督管理局', position: '审核员', role: '审核员', totalCalls: 980, riskCount: 18 },
  { id: 'P004', name: '李伟', unitId: 'U002', unitName: '市公安局出入境管理支队', position: '副支队长', role: '审批员', totalCalls: 420, riskCount: 3 },
  { id: 'P005', name: '王小丽', unitId: 'U003', unitName: '市人力资源和社会保障局', position: '业务主管', role: '审批员', totalCalls: 1680, riskCount: 22 },
  { id: 'P006', name: '赵建国', unitId: 'U004', unitName: '市住房和城乡建设局', position: '业务科长', role: '审批员', totalCalls: 560, riskCount: 35 },
  { id: 'P007', name: '孙明', unitId: 'U004', unitName: '市住房和城乡建设局', position: '受理员', role: '受理员', totalCalls: 890, riskCount: 48 },
  { id: 'P008', name: '刘芳', unitId: 'U005', unitName: '市卫生健康委员会', position: '医政科', role: '审核员', totalCalls: 1250, riskCount: 15 },
  { id: 'P009', name: '周涛', unitId: 'U007', unitName: '市税务局', position: '征管科', role: '审批员', totalCalls: 2150, riskCount: 25 },
  { id: 'P010', name: '陈静', unitId: 'U007', unitName: '市税务局', position: '纳服科', role: '受理员', totalCalls: 3280, riskCount: 42 }
];

const matters: Matter[] = [
  { id: 'M001', name: '企业设立登记', code: 'GS001', category: '企业登记', department: '市市场监督管理局', requiredCerts: ['营业执照', '身份证', '不动产权证'], totalCalls: 4520 },
  { id: 'M002', name: '个体工商户注册', code: 'GS002', category: '企业登记', department: '市市场监督管理局', requiredCerts: ['身份证', '经营场所证明'], totalCalls: 3680 },
  { id: 'M003', name: '食品经营许可证办理', code: 'GS003', category: '行政许可', department: '市市场监督管理局', requiredCerts: ['营业执照', '身份证', '健康证'], totalCalls: 2850 },
  { id: 'M004', name: '护照办理', code: 'GA001', category: '出入境', department: '市公安局出入境管理支队', requiredCerts: ['身份证', '户口本'], totalCalls: 4120 },
  { id: 'M005', name: '港澳通行证办理', code: 'GA002', category: '出入境', department: '市公安局出入境管理支队', requiredCerts: ['身份证', '户口本'], totalCalls: 3560 },
  { id: 'M006', name: '社保登记', code: 'RS001', category: '社会保障', department: '市人力资源和社会保障局', requiredCerts: ['身份证', '营业执照'], totalCalls: 5680 },
  { id: 'M007', name: '就业补贴申请', code: 'RS002', category: '社会保障', department: '市人力资源和社会保障局', requiredCerts: ['身份证', '毕业证', '劳动合同'], totalCalls: 3890 },
  { id: 'M008', name: '退休审批', code: 'RS003', category: '社会保障', department: '市人力资源和社会保障局', requiredCerts: ['身份证', '档案证明', '社保缴费证明'], totalCalls: 2450 },
  { id: 'M009', name: '商品房预售许可', code: 'ZJ001', category: '行政许可', department: '市住房和城乡建设局', requiredCerts: ['营业执照', '土地使用证', '规划许可证'], totalCalls: 1850 },
  { id: 'M010', name: '施工许可证办理', code: 'ZJ002', category: '行政许可', department: '市住房和城乡建设局', requiredCerts: ['营业执照', '资质证书', '规划许可证'], totalCalls: 1620 },
  { id: 'M011', name: '医疗机构执业许可', code: 'WJ001', category: '行政许可', department: '市卫生健康委员会', requiredCerts: ['营业执照', '资质证书', '身份证'], totalCalls: 2150 },
  { id: 'M012', name: '教师资格认定', code: 'JY001', category: '资格认定', department: '市教育局', requiredCerts: ['身份证', '毕业证', '普通话证书'], totalCalls: 1890 },
  { id: 'M013', name: '税务登记', code: 'SW001', category: '税务', department: '市税务局', requiredCerts: ['营业执照', '身份证'], totalCalls: 6580 },
  { id: 'M014', name: '发票领用', code: 'SW002', category: '税务', department: '市税务局', requiredCerts: ['营业执照', '身份证', '发票领购簿'], totalCalls: 8950 },
  { id: 'M015', name: '婚姻登记', code: 'MZ001', category: '民政', department: '市民政局', requiredCerts: ['身份证', '户口本'], totalCalls: 2340 }
];

const certTypes = ['身份证', '营业执照', '不动产权证', '户口本', '毕业证', '健康证', '结婚证', '驾驶证', '护照', '社保卡', '土地使用证', '规划许可证', '资质证书', '劳动合同', '普通话证书'];

function generateCallRecords(count: number): CallRecord[] {
  const records: CallRecord[] = [];
  const riskTagPool = [
    '无审批调证',
    '授权过期',
    '高频查询',
    '短时多次查询',
    '多部门交叉查询',
    '查看无结果',
    '授权时间不匹配',
    '非正常工作时间',
    '异地IP访问',
    '异常设备登录'
  ];

  for (let i = 0; i < count; i++) {
    const unit = units[Math.floor(Math.random() * units.length)];
    const unitPersonnel = personnel.filter(p => p.unitId === unit.id);
    const person = unitPersonnel.length > 0
      ? unitPersonnel[Math.floor(Math.random() * unitPersonnel.length)]
      : personnel[Math.floor(Math.random() * personnel.length)];
    const unitMatters = matters.filter(m => m.department === unit.name);
    const matter = unitMatters.length > 0
      ? unitMatters[Math.floor(Math.random() * unitMatters.length)]
      : matters[Math.floor(Math.random() * matters.length)];
    const certType = matter.requiredCerts[Math.floor(Math.random() * matter.requiredCerts.length)] || certTypes[Math.floor(Math.random() * certTypes.length)];

    const baseTime = new Date(2026, 4, 1);
    const randomOffset = Math.random() * 50 * 24 * 60 * 60 * 1000;
    const callTime = new Date(baseTime.getTime() + randomOffset);

    const hasApproval = Math.random() > 0.15;
    const hasResult = Math.random() > 0.25;
    const isComplained = Math.random() < 0.03;

    const riskTags: string[] = [];
    let riskLevel: RiskLevel = 'low';

    if (!hasApproval) riskTags.push('无审批调证');
    if (!hasResult && Math.random() > 0.7) riskTags.push('查看无结果');
    if (Math.random() < 0.05) riskTags.push('授权时间不匹配');
    if (Math.random() < 0.04) riskTags.push('高频查询');
    if (Math.random() < 0.03) riskTags.push('短时多次查询');
    if (Math.random() < 0.02) riskTags.push('多部门交叉查询');
    if (callTime.getHours() < 6 || callTime.getHours() > 22) riskTags.push('非正常工作时间');

    if (riskTags.length >= 3) riskLevel = 'high';
    else if (riskTags.length >= 1) riskLevel = 'medium';

    const callHour = callTime.getHours().toString().padStart(2, '0');
    const callMinute = callTime.getMinutes().toString().padStart(2, '0');

    records.push({
      id: `R${(100000 + i).toString()}`,
      transactionId: `T${Date.now()}${i.toString().padStart(5, '0')}`,
      callTime: `${callTime.getFullYear()}-${(callTime.getMonth() + 1).toString().padStart(2, '0')}-${callTime.getDate().toString().padStart(2, '0')} ${callHour}:${callMinute}:00`,
      unitId: unit.id,
      unitName: unit.name,
      personnelId: person.id,
      personnelName: person.name,
      matterId: matter.id,
      matterName: matter.name,
      certId: `CERT${Math.floor(Math.random() * 900000 + 100000)}`,
      certType: certType,
      certNo: `${certType.slice(0, 2)}${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      holderName: `持证人${i + 1}`,
      operationType: (['query', 'query', 'query', 'download', 'verify', 'share'] as const)[Math.floor(Math.random() * 6)],
      sourceIp: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      deviceInfo: `Windows 10; Chrome ${Math.floor(Math.random() * 50 + 100)}.0`,
      authorizationId: `AUTH${Math.floor(Math.random() * 900000 + 100000)}`,
      authorizationTime: hasApproval ? `${callTime.getFullYear()}-${(callTime.getMonth() + 1).toString().padStart(2, '0')}-${callTime.getDate().toString().padStart(2, '0')} 08:30:00` : undefined,
      authorizationExpireTime: hasApproval ? `${callTime.getFullYear()}-${(callTime.getMonth() + 1).toString().padStart(2, '0')}-${callTime.getDate().toString().padStart(2, '0')} 18:00:00` : undefined,
      approvalId: hasApproval ? `AP${Math.floor(Math.random() * 900000 + 100000)}` : undefined,
      approvalRecord: hasApproval ? {
        id: `AP${Math.floor(Math.random() * 900000 + 100000)}`,
        approverId: 'AP001',
        approverName: '审批员',
        approvalTime: `${callTime.getFullYear()}-${(callTime.getMonth() + 1).toString().padStart(2, '0')}-${callTime.getDate().toString().padStart(2, '0')} 08:35:00`,
        approvalOpinion: '同意',
        approvalResult: 'approved'
      } : undefined,
      hasApproval,
      hasResult,
      resultStatus: hasResult ? (['completed', 'completed', 'completed', 'processing', 'rejected'] as const)[Math.floor(Math.random() * 5)] : 'pending',
      isComplained,
      complainId: isComplained ? `COMP${Math.floor(Math.random() * 900000 + 100000)}` : undefined,
      complaintContent: isComplained ? '个人信息被未授权查询，要求调查处理' : undefined,
      riskTags,
      riskLevel,
      remark: ''
    });
  }
  return records.sort((a, b) => new Date(b.callTime).getTime() - new Date(a.callTime).getTime());
}

const callRecords = generateCallRecords(500);

const riskClues: RiskClue[] = [
  {
    id: 'CL001',
    clueNo: 'XZ-2026-06-001',
    title: '市住建局孙明高频查询不动产权证但办结率低',
    type: '高频查看无办结',
    description: '2026年5月期间，市住建局受理员孙明累计查询不动产权证238次，但办结率仅为35%，远低于单位平均水平，存在异常。',
    riskLevel: 'high',
    unitId: 'U004',
    unitName: '市住房和城乡建设局',
    personnelId: 'P007',
    personnelName: '孙明',
    relatedRecordIds: callRecords.filter(r => r.personnelId === 'P007').slice(0, 10).map(r => r.id),
    discoveredTime: '2026-06-10 09:15:00',
    discoveredBy: '系统自动预警',
    status: 'investigating',
    priority: 'urgent',
    investigator: '巡察一组',
    accountabilityStatus: 'pending',
    tags: ['高频查询', '低办结率', '不动产权证']
  },
  {
    id: 'CL002',
    clueNo: 'XZ-2026-06-002',
    title: '企业营业执照被多部门短时连续查询',
    type: '多部门交叉查询',
    description: '统一社会信用代码为XXX的企业营业执照，在2026年5月15日14:23-14:45期间，被市场监管局、税务局、住建局3个部门累计查询12次，存在异常。',
    riskLevel: 'high',
    unitId: 'U001',
    unitName: '市市场监督管理局',
    relatedRecordIds: callRecords.slice(10, 22).map(r => r.id),
    discoveredTime: '2026-06-08 14:30:00',
    discoveredBy: '审计处',
    status: 'verified',
    priority: 'high',
    conclusion: '经查，该企业正在办理多项业务变更，查询行为属实但未按规定集中办理，已约谈相关责任人。',
    conclusionTime: '2026-06-15 16:20:00',
    investigator: '巡察二组',
    accountabilityStatus: 'processing',
    accountabilityResult: '对3个单位的业务经办人进行批评教育，要求规范调证流程。',
    tags: ['多部门查询', '短时连续', '营业执照']
  },
  {
    id: 'CL003',
    clueNo: 'XZ-2026-06-003',
    title: '市场监管局李红无审批调证18次',
    type: '无审批调证',
    description: '系统审计发现，市市场监督管理局受理员李红在2026年5月累计存在18次无审批记录的证照调用，涉及身份证、营业执照等敏感证照。',
    riskLevel: 'high',
    unitId: 'U001',
    unitName: '市市场监督管理局',
    personnelId: 'P002',
    personnelName: '李红',
    relatedRecordIds: callRecords.filter(r => !r.hasApproval).slice(0, 18).map(r => r.id),
    discoveredTime: '2026-06-05 10:00:00',
    discoveredBy: '系统自动预警',
    status: 'investigating',
    priority: 'urgent',
    investigator: '纪检组',
    accountabilityStatus: 'pending',
    tags: ['无审批', '敏感证照', '高风险']
  },
  {
    id: 'CL004',
    clueNo: 'XZ-2026-06-004',
    title: '授权时间与调用时间不匹配问题',
    type: '授权异常',
    description: '发现12条调用记录的调用时间早于授权生效时间或晚于授权失效时间，涉及市税务局、人社局等单位。',
    riskLevel: 'medium',
    unitId: 'U007',
    unitName: '市税务局',
    relatedRecordIds: callRecords.slice(22, 34).map(r => r.id),
    discoveredTime: '2026-06-03 11:20:00',
    discoveredBy: '效能办',
    status: 'pending',
    priority: 'normal',
    accountabilityStatus: 'none',
    tags: ['授权异常', '时间不匹配']
  },
  {
    id: 'CL005',
    clueNo: 'XZ-2026-06-005',
    title: '投诉件锁定：公民个人信息被违规查询',
    type: '投诉线索',
    description: '市民投诉称其个人身份信息在未办理任何业务的情况下被住建局查询，要求调查处理并反馈结果。',
    riskLevel: 'high',
    unitId: 'U004',
    unitName: '市住房和城乡建设局',
    relatedRecordIds: callRecords.filter(r => r.isComplained).map(r => r.id),
    discoveredTime: '2026-06-12 15:45:00',
    discoveredBy: '信访转办',
    status: 'investigating',
    priority: 'urgent',
    investigator: '巡察一组',
    accountabilityStatus: 'pending',
    tags: ['投诉', '个人信息', '违规查询']
  },
  {
    id: 'CL006',
    clueNo: 'XZ-2026-06-006',
    title: '人社局就业补贴事项批量异常查询',
    type: '异常模式',
    description: '2026年5月20-25日期间，人社局就业补贴申请事项存在连续5天每日查询量超过200次的异常峰值，远超日常水平。',
    riskLevel: 'medium',
    unitId: 'U003',
    unitName: '市人力资源和社会保障局',
    personnelId: 'P005',
    personnelName: '王小丽',
    relatedRecordIds: callRecords.slice(34, 50).map(r => r.id),
    discoveredTime: '2026-06-01 09:30:00',
    discoveredBy: '审计处',
    status: 'closed',
    priority: 'normal',
    conclusion: '经查为毕业季补贴申请集中期，已核实为正常业务高峰，不存在违规行为。',
    conclusionTime: '2026-06-08 14:00:00',
    investigator: '巡察三组',
    accountabilityStatus: 'none',
    accountabilityResult: '无违规，不予问责。',
    tags: ['批量查询', '业务高峰', '已核实']
  },
  {
    id: 'CL007',
    clueNo: 'XZ-2026-06-007',
    title: '非正常工作时间调证行为分析',
    type: '时间异常',
    description: '发现38条在凌晨0:00-6:00之间的证照调用记录，涉及5个单位12名工作人员，需核实是否为加班业务。',
    riskLevel: 'medium',
    unitId: 'U001',
    unitName: '市市场监督管理局',
    relatedRecordIds: callRecords.slice(50, 88).map(r => r.id),
    discoveredTime: '2026-06-07 08:15:00',
    discoveredBy: '系统自动预警',
    status: 'pending',
    priority: 'normal',
    accountabilityStatus: 'none',
    tags: ['非工作时间', '凌晨查询']
  },
  {
    id: 'CL008',
    clueNo: 'XZ-2026-06-008',
    title: '住建局赵建国审批流于形式问题',
    type: '审批异常',
    description: '市住建局赵建国作为审批人，其审批通过的调证申请中存在26项事后核查发现材料不全或依据不足的情况。',
    riskLevel: 'medium',
    unitId: 'U004',
    unitName: '市住房和城乡建设局',
    personnelId: 'P006',
    personnelName: '赵建国',
    relatedRecordIds: callRecords.slice(88, 114).map(r => r.id),
    discoveredTime: '2026-06-09 16:30:00',
    discoveredBy: '纪检组',
    status: 'verified',
    priority: 'high',
    conclusion: '赵建国存在审批把关不严问题，已形成初步核查意见。',
    conclusionTime: '2026-06-16 11:00:00',
    investigator: '纪检组',
    accountabilityStatus: 'completed',
    accountabilityResult: '给予党内警告处分，调整工作岗位。',
    tags: ['审批把关', '材料不全', '已问责']
  }
];

const evidenceChains: EvidenceChain[] = [
  {
    id: 'EC001',
    transactionId: 'T202606100001',
    businessNo: 'QY202606100023',
    applicantName: '张三',
    matterId: 'M001',
    matterName: '企业设立登记',
    unitId: 'U001',
    unitName: '市市场监督管理局',
    startTime: '2026-06-10 09:15:00',
    endTime: '2026-06-10 10:45:30',
    totalDuration: 5430,
    isComplete: true,
    riskPoints: ['步骤3授权时间与实际调用存在5分钟偏差'],
    steps: [
      {
        stepNo: 1,
        stepName: '企业登记申请提交',
        operatorId: 'AP001',
        operatorName: '张三（申请人）',
        actionTime: '2026-06-10 09:15:00',
        actionType: 'submit',
        remark: '在线提交企业设立登记申请，上传相关材料'
      },
      {
        stepNo: 2,
        stepName: '受理审批',
        operatorId: 'P001',
        operatorName: '张明',
        unitId: 'U001',
        unitName: '市市场监督管理局',
        actionTime: '2026-06-10 09:32:00',
        actionType: 'approve',
        remark: '材料齐全，同意受理'
      },
      {
        stepNo: 3,
        stepName: '调用申请人身份证',
        operatorId: 'P002',
        operatorName: '李红',
        unitId: 'U001',
        unitName: '市市场监督管理局',
        actionTime: '2026-06-10 09:35:00',
        actionType: 'callCert',
        certId: 'CERT100001',
        certType: '身份证',
        authorizationCheck: 'mismatched',
        remark: '⚠️ 授权生效时间为09:40，调用时间早于授权时间5分钟',
        ip: '192.168.1.101'
      },
      {
        stepNo: 4,
        stepName: '调用经营场所不动产权证',
        operatorId: 'P002',
        operatorName: '李红',
        unitId: 'U001',
        unitName: '市市场监督管理局',
        actionTime: '2026-06-10 09:42:00',
        actionType: 'callCert',
        certId: 'CERT100002',
        certType: '不动产权证',
        authorizationCheck: 'matched',
        ip: '192.168.1.101'
      },
      {
        stepNo: 5,
        stepName: '材料审核通过',
        operatorId: 'P003',
        operatorName: '王强',
        unitId: 'U001',
        unitName: '市市场监督管理局',
        actionTime: '2026-06-10 10:20:00',
        actionType: 'sign',
        remark: '审核通过'
      },
      {
        stepNo: 6,
        stepName: '营业执照下载',
        operatorId: 'P001',
        operatorName: '张明',
        unitId: 'U001',
        unitName: '市市场监督管理局',
        actionTime: '2026-06-10 10:45:30',
        actionType: 'download',
        certId: 'CERT100003',
        certType: '营业执照',
        authorizationCheck: 'matched'
      },
      {
        stepNo: 7,
        stepName: '办件完成',
        operatorId: 'SYSTEM',
        operatorName: '系统',
        actionTime: '2026-06-10 10:45:30',
        actionType: 'complete'
      }
    ]
  },
  {
    id: 'EC002',
    transactionId: 'T202606120005',
    businessNo: 'SB202606120088',
    applicantName: '李四',
    matterId: 'M006',
    matterName: '社保登记',
    unitId: 'U003',
    unitName: '市人力资源和社会保障局',
    startTime: '2026-06-12 14:02:00',
    endTime: '2026-06-12 15:30:00',
    totalDuration: 5280,
    isComplete: true,
    riskPoints: [],
    steps: [
      { stepNo: 1, stepName: '社保登记申请提交', operatorName: '李四（申请人）', actionTime: '2026-06-12 14:02:00', actionType: 'submit' },
      { stepNo: 2, stepName: '窗口受理', operatorId: 'P005', operatorName: '王小丽', unitId: 'U003', unitName: '市人力资源和社会保障局', actionTime: '2026-06-12 14:15:00', actionType: 'approve' },
      { stepNo: 3, stepName: '调用身份证核验', operatorId: 'P005', operatorName: '王小丽', unitId: 'U003', unitName: '市人力资源和社会保障局', actionTime: '2026-06-12 14:18:00', actionType: 'callCert', certType: '身份证', authorizationCheck: 'matched', ip: '192.168.2.55' },
      { stepNo: 4, stepName: '调用营业执照核验', operatorId: 'P005', operatorName: '王小丽', unitId: 'U003', unitName: '市人力资源和社会保障局', actionTime: '2026-06-12 14:20:00', actionType: 'callCert', certType: '营业执照', authorizationCheck: 'matched', ip: '192.168.2.55' },
      { stepNo: 5, stepName: '信息录入完成', operatorId: 'P005', operatorName: '王小丽', unitId: 'U003', unitName: '市人力资源和社会保障局', actionTime: '2026-06-12 15:00:00', actionType: 'sign' },
      { stepNo: 6, stepName: '社保登记完成', operatorName: '系统', actionTime: '2026-06-12 15:30:00', actionType: 'complete' }
    ]
  },
  {
    id: 'EC003',
    transactionId: 'T202606150012',
    businessNo: 'JGCY202606150015',
    applicantName: '某某建设有限公司',
    matterId: 'M010',
    matterName: '施工许可证办理',
    unitId: 'U004',
    unitName: '市住房和城乡建设局',
    startTime: '2026-06-15 08:30:00',
    endTime: '2026-06-15 17:20:00',
    totalDuration: 31800,
    isComplete: false,
    riskPoints: ['步骤3无审批记录直接调用资质证书', '步骤5申请人发起投诉'],
    steps: [
      { stepNo: 1, stepName: '施工许可申请提交', operatorName: '公司经办人', actionTime: '2026-06-15 08:30:00', actionType: 'submit' },
      { stepNo: 2, stepName: '窗口受理', operatorId: 'P007', operatorName: '孙明', unitId: 'U004', unitName: '市住房和城乡建设局', actionTime: '2026-06-15 09:12:00', actionType: 'approve', remark: '形式审查通过' },
      { stepNo: 3, stepName: '调用企业资质证书', operatorId: 'P007', operatorName: '孙明', unitId: 'U004', unitName: '市住房和城乡建设局', actionTime: '2026-06-15 09:20:00', actionType: 'callCert', certType: '资质证书', authorizationCheck: 'none', remark: '⚠️ 无审批依据直接调证', ip: '192.168.3.88' },
      { stepNo: 4, stepName: '调用规划许可证', operatorId: 'P007', operatorName: '孙明', unitId: 'U004', unitName: '市住房和城乡建设局', actionTime: '2026-06-15 09:25:00', actionType: 'callCert', certType: '规划许可证', authorizationCheck: 'none', remark: '⚠️ 无审批依据直接调证', ip: '192.168.3.88' },
      { stepNo: 5, stepName: '申请人投诉', operatorName: '公司经办人', actionTime: '2026-06-15 16:45:00', actionType: 'complain', remark: '办事效率低，质疑工作人员违规查询企业信息' },
      { stepNo: 6, stepName: '办件挂起待核查', operatorName: '系统', actionTime: '2026-06-15 17:20:00', actionType: 'complete', remark: '因投诉，办件暂停处理' }
    ]
  }
];

const complaintRecords: ComplaintRecord[] = [
  {
    id: 'C001',
    complaintNo: 'TS20260610001',
    complainantName: '王五',
    complainantPhone: '13800138001',
    complainantIdNo: '440101********0001',
    relatedTransactionId: 'T202606080055',
    relatedUnitId: 'U004',
    relatedUnitName: '市住房和城乡建设局',
    relatedPersonnelId: 'P007',
    relatedPersonnelName: '孙明',
    complaintType: '违规查询个人信息',
    complaintContent: '本人未在住建局办理任何业务，但系统显示我的不动产权证信息于2026年6月8日被查询，要求核实并给出解释。',
    complaintTime: '2026-06-10 09:30:00',
    status: 'processing',
    handler: '巡察一组',
    certInvolved: ['不动产权证', '身份证']
  },
  {
    id: 'C002',
    complaintNo: 'TS20260612002',
    complainantName: 'XX科技有限公司',
    complainantPhone: '020-88888888',
    relatedTransactionId: 'T202606120012',
    relatedUnitId: 'U001',
    relatedUnitName: '市市场监督管理局',
    complaintType: '证照信息泄露质疑',
    complaintContent: '我司营业执照信息在未授权情况下被其他部门查询多次，质疑存在信息泄露风险。',
    complaintTime: '2026-06-12 15:20:00',
    status: 'replied',
    handler: '信访办',
    replyContent: '经查为跨部门业务协同查询，已履行审批程序，不存在信息泄露问题。',
    replyTime: '2026-06-14 10:15:00',
    certInvolved: ['营业执照']
  },
  {
    id: 'C003',
    complaintNo: 'TS20260615003',
    complainantName: '赵六',
    complainantPhone: '13900139003',
    relatedUnitId: 'U007',
    relatedUnitName: '市税务局',
    relatedPersonnelId: 'P010',
    relatedPersonnelName: '陈静',
    complaintType: '服务态度及效率问题',
    complaintContent: '办理发票领用时，工作人员反复查询我的证照信息，办事时间长达3小时，效率低下。',
    complaintTime: '2026-06-15 17:00:00',
    status: 'pending',
    certInvolved: ['营业执照', '身份证', '发票领购簿']
  }
];

const unitComplianceMetrics: UnitComplianceMetrics[] = units.map(unit => {
  const levelMap: Record<number, UnitComplianceMetrics['complianceLevel']> = {
    95: 'excellent', 85: 'good', 75: 'fair', 60: 'poor', 0: 'critical'
  };
  const rate = unit.complianceRate;
  let level: UnitComplianceMetrics['complianceLevel'] = 'fair';
  for (const [threshold, l] of Object.entries(levelMap)) {
    if (rate >= Number(threshold)) {
      level = l;
      break;
    }
  }
  return {
    unitId: unit.id,
    unitName: unit.name,
    period: '2026年5月',
    totalCalls: unit.totalCalls,
    approvedCalls: Math.round(unit.totalCalls * (1 - unit.abnormalCount / unit.totalCalls * 0.6)),
    approvalRate: Number((100 - unit.riskScore * 0.5).toFixed(1)),
    unauthorizedCalls: Math.round(unit.abnormalCount * 0.35),
    expiredAuthCalls: Math.round(unit.abnormalCount * 0.15),
    resultRate: Number((85 + Math.random() * 12).toFixed(1)),
    complaintCount: Math.round(unit.abnormalCount * 0.08),
    abnormalPatternCount: Math.round(unit.abnormalCount * 0.42),
    riskScore: unit.riskScore,
    complianceLevel: level,
    dimensionScores: {
      approvalCompliance: Math.min(100, Math.round(100 - unit.riskScore * 0.4 + Math.random() * 10)),
      authorizationAccuracy: Math.min(100, Math.round(100 - unit.riskScore * 0.35 + Math.random() * 10)),
      resultEfficiency: Math.min(100, Math.round(100 - unit.riskScore * 0.3 + Math.random() * 10)),
      complaintHandling: Math.min(100, Math.round(100 - unit.riskScore * 0.2 + Math.random() * 15)),
      operationStandardization: Math.min(100, Math.round(100 - unit.riskScore * 0.45 + Math.random() * 10))
    }
  };
});

const dailyStats: DailyStats[] = [];
for (let i = 49; i >= 0; i--) {
  const d = new Date(2026, 4, 15);
  d.setDate(d.getDate() - i);
  dailyStats.push({
    date: `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`,
    totalCalls: Math.floor(800 + Math.random() * 600),
    approvedCalls: Math.floor(700 + Math.random() * 500),
    abnormalCalls: Math.floor(10 + Math.random() * 40),
    complaintCount: Math.floor(Math.random() * 5)
  });
}

export const mockData = {
  units,
  personnel,
  matters,
  certTypes,
  callRecords,
  riskClues,
  evidenceChains,
  complaintRecords,
  unitComplianceMetrics,
  dailyStats
};
