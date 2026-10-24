'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LinkedInSettingsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', type: 'basic' });

  async function handleConnect() {
    // TODO: 调 Unipile API 连接账号
    console.log('Connecting...', form);
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">LinkedIn 账号管理</h1>
          <p className="text-sm text-muted-foreground">
            绑定你的 LinkedIn 账号，TradePulse 通过 Unipile 安全连接，
            不会存储你的密码。
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          + 添加账号
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">连接 LinkedIn 账号</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>LinkedIn 邮箱</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn 密码</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                placeholder="********"
              />
            </div>
            <div className="space-y-2">
              <Label>账号类型</Label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="basic">基础版（免费）</option>
                <option value="sales_navigator">Sales Navigator（推荐）</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleConnect}>连接</Button>
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                取消
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              🔒 密码通过 Unipile 加密传输，不会存储在我们的服务器上。
              连接成功后可以使用 Sales Navigator 获取更精准的搜索结果。
            </p>
          </CardContent>
        </Card>
      )}

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <div className="text-4xl">🔗</div>
            <p className="text-sm text-muted-foreground">
              还没有绑定 LinkedIn 账号。添加账号后即可开始监控海外客户信号。
            </p>
            <Button variant="outline" onClick={() => setShowForm(true)}>
              添加第一个账号
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {accounts.map((acc) => (
            <Card key={acc.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{acc.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {acc.type === 'sales_navigator' ? 'Sales Navigator' : '基础版'}
                    {' · '}
                    {acc.status === 'active' ? '🟢 正常' : '🔴 异常'}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  断开
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
