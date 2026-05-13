import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-apple-text">Settings</h1>
        <p className="text-apple-text-muted mt-1">Manage your PM Bot preferences and integrations.</p>
      </div>

      <div className="grid gap-6">
        {/* Plane Integration Card */}
        <div className="bg-apple-card/80 backdrop-blur-xl border border-apple-border/50 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-apple-border/50 bg-white/30 backdrop-blur-md">
            <h2 className="text-lg font-semibold text-apple-text">Plane Integration</h2>
            <p className="text-sm text-apple-text-muted mt-0.5">Configure your connection to Plane workspace.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-apple-text-muted uppercase tracking-wide">Workspace Slug</label>
              <Input
                placeholder="e.g. my-company"
                defaultValue="demo-workspace"
                className="border-apple-border/60 focus:ring-apple-blue/30 focus:border-apple-blue"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-apple-text-muted uppercase tracking-wide">API Key</label>
              <Input
                type="password"
                placeholder="plane_api_..."
                defaultValue="plane_api_12345"
                className="border-apple-border/60 focus:ring-apple-blue/30 focus:border-apple-blue"
              />
            </div>
            <Button className="bg-apple-blue hover:bg-apple-blue-hover text-white">
              Save Changes
            </Button>
          </div>
        </div>

        {/* Agent Preferences Card */}
        <div className="bg-apple-card/80 backdrop-blur-xl border border-apple-border/50 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-apple-border/50 bg-white/30 backdrop-blur-md">
            <h2 className="text-lg font-semibold text-apple-text">Agent Preferences</h2>
            <p className="text-sm text-apple-text-muted mt-0.5">Customize how PM Bot analyzes and responds to issues.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-apple-text-muted uppercase tracking-wide">Polling Interval (minutes)</label>
              <Input
                type="number"
                defaultValue="5"
                className="border-apple-border/60 focus:ring-apple-blue/30 focus:border-apple-blue"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-apple-text-muted uppercase tracking-wide">Default Triage Label Color</label>
              <div className="flex gap-3">
                <button className="w-8 h-8 rounded-full bg-red-500 cursor-pointer ring-2 ring-offset-2 ring-apple-blue" title="Red" />
                <button className="w-8 h-8 rounded-full bg-orange-500 cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-apple-border transition-all" title="Orange" />
                <button className="w-8 h-8 rounded-full bg-green-500 cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-apple-border transition-all" title="Green" />
                <button className="w-8 h-8 rounded-full bg-blue-500 cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-apple-border transition-all" title="Blue" />
              </div>
            </div>
            <Button variant="outline" className="border-apple-border/60">
              Update Preferences
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
