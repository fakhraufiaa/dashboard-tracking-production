"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Zap } from "lucide-react";

type Props = {
  count: number;
  amount: number;
};

export default function LinesPacking({ count, amount }: Props) {
  return (
    <div>
      <Card
        className="
          transition-all hover:shadow-md relative overflow-hidden
          // 📱 mobile -> bulat kecil
          rounded-full h-24 w-24 flex flex-col items-center justify-center text-center
          // 💻 md+ -> kotak normal
          md:rounded-xl md:h-auto md:w-auto md:block bg-chart-3/30
        "
      >
        <div className="md:hidden flex flex-col items-center justify-center">
          <span className="text-xs font-medium">FINISHING</span>
          <span className="text-lg font-bold text-primary">{count}</span>
        </div>
        {/* desktop card */}
        <div className="hidden md:block">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge className="text-xs bg-secondary">FINISHING</Badge>
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
        </div>
      </Card>
    </div>
  );
}
