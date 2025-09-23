"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Zap } from "lucide-react";

type Props = {
  count: number;
  amount: number;
};

export default function LinesAssy({ count, amount }: Props) {
  return (
    <>
      {/* 📱 Mobile bubble */}
      <div
        className="
          md:hidden flex flex-col items-center justify-center
          h-24 w-24 rounded-full
          bg-gradient-to-br from-chart-3 to-chart-4
          shadow-lg ring-5 ring-chart-3/40
          relative mx-auto
        "
      >
        <span className="text-[10px] font-medium tracking-wide">ASSY</span>
        <span className="text-xl font-extrabold">{count}</span>
      </div>

      {/* 💻 Desktop card */}
      <Card
        className="
          hidden md:block transition-all hover:shadow-md
          relative overflow-hidden rounded-xl bg-chart-3/30
        "
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge className="text-xs bg-secondary">ASSY</Badge>
            <Zap className="h-4 w-4 text-secondary" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{count}</div>
            <p className="text-xs text-gray-500">units</p>
          </div>
          <Separator />
          <div className="flex items-center justify-center space-x-1">
            <Users className="h-3 w-3 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">
              {amount} personnel
            </span>
          </div>
        </CardContent>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-chart-1 opacity-70" />
      </Card>
    </>
  );
}
