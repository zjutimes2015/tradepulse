/**
 * TradePulse Dashboard 主页面
 * 中文界面，展示核心数据
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// 模拟数据 - MVP 阶段先写死，后续接数据库
const MOCK_STATS = {
  totalLeads: 0,
  pendingReview: 0,
  sentMessages: 0,
  replies: 0,
  meetings: 0,
};

const MOCK_RECENT_SIGNALS: any[] = [];

export default function DashboardPage() {
  const [stats] = useState(MOCK_STATS);
  const [recentSignals] = useState(MOCK_RECENT_SIGNALS);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            你的 AI 海外客户开发助手
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/campaigns">新建投放</a>
          </Button>
          <Button asChild>
            <a href="/settings/linkedin">连接 LinkedIn</a>
          </Button>
        </div>
      </div>

      {/* 数据卡片 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              累计线索
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              待审核
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-500">
              {stats.pendingReview}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              已发送
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-500">
              {stats.sentMessages}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              收到回复
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">
              {stats.replies}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              预约会议
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-500">
              {stats.meetings}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">快速开始</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            TradePulse 帮你监控 LinkedIn 上的海外客户信号，AI 自动写消息，你只需要确认发送。
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-2 pt-6">
                <div className="text-3xl">🔗</div>
                <h3 className="font-medium">1. 连接 LinkedIn</h3>
                <p className="text-center text-xs text-muted-foreground">
                  绑定你的 LinkedIn 账号，TradePulse 不会存储密码
                </p>
                <Button size="sm" variant="outline" asChild>
                  <a href="/settings/linkedin">去绑定</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-2 pt-6">
                <div className="text-3xl">🎯</div>
                <h3 className="font-medium">2. 创建投放</h3>
                <p className="text-center text-xs text-muted-foreground">
                  设置目标市场行业、地区、关键词
                </p>
                <Button size="sm" variant="outline" asChild>
                  <a href="/campaigns">去创建</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-2 pt-6">
                <div className="text-3xl">✅</div>
                <h3 className="font-medium">3. 确认发送</h3>
                <p className="text-center text-xs text-muted-foreground">
                  AI 生成消息，你确认后再发送
                </p>
                <Button size="sm" variant="outline" disabled>
                  等待第2步
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* 最近信号 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">最近监控到的信号</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSignals.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <div className="text-4xl text-muted-foreground">📡</div>
              <p className="text-sm text-muted-foreground">
                还没有信号数据。连接 LinkedIn 账号并创建投放后，
                <br />
                TradePulse 会自动开始监控海外客户信号。
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="/campaigns">创建第一个投放</a>
              </Button>
            </div>
          ) : (
            <p>信号列表（待数据）</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
