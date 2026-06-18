import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Badge, Typography, theme } from 'antd';
import {
  DashboardOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  FileProtectOutlined,
  ExportOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import ClueScreening from '../pages/ClueScreening';
import TimelineTrace from '../pages/TimelineTrace';
import UnitProfile from '../pages/UnitProfile';
import CaseManagement from '../pages/CaseManagement';
import EvidenceExport from '../pages/EvidenceExport';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '审计总览' },
  { key: '/clue-screening', icon: <SearchOutlined />, label: '线索筛查' },
  { key: '/timeline-trace', icon: <ClockCircleOutlined />, label: '时序追踪' },
  { key: '/unit-profile', icon: <TeamOutlined />, label: '单位画像' },
  { key: '/case-management', icon: <FileProtectOutlined />, label: '案例管理' },
  { key: '/evidence-export', icon: <ExportOutlined />, label: '取证导出' }
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken();

  const userMenu = {
    items: [
      { key: '1', icon: <UserOutlined />, label: '个人中心' },
      { key: '2', icon: <SettingOutlined />, label: '系统设置' },
      { type: 'divider' as const },
      { key: '3', icon: <LogoutOutlined />, label: '退出登录' }
    ]
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={240}
      >
        <div
          style={{
            height: 64,
            margin: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 12,
            color: '#fff'
          }}
        >
          <SafetyCertificateOutlined style={{ fontSize: collapsed ? 28 : 32, color: '#1890ff' }} />
          {!collapsed && (
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>电子证照</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>审计分析系统</div>
            </div>
          )}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0'
          }}
        >
          <Title level={4} style={{ margin: 0, color: '#1f1f1f' }}>
            {menuItems.find(m => m.key === location.pathname)?.label as string}
          </Title>
          <Space size={20}>
            <Badge count={8} offset={[0, 2]}>
              <BellOutlined style={{ fontSize: 20, color: '#666', cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 4 }}>
                <Avatar size="small" style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
                <span>审计管理员</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div
            style={{
              padding: 16,
              minHeight: 'calc(100vh - 64px - 32px)',
              background: colorBgContainer,
              borderRadius: borderRadiusLG
            }}
          >
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clue-screening" element={<ClueScreening />} />
              <Route path="/timeline-trace" element={<TimelineTrace />} />
              <Route path="/unit-profile" element={<UnitProfile />} />
              <Route path="/case-management" element={<CaseManagement />} />
              <Route path="/evidence-export" element={<EvidenceExport />} />
              <Route path="/" element={<Dashboard />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
