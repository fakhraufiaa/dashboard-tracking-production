"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Users } from "lucide-react"

type Props = {
  count: number
  amount: number
}

export default function LinesQC({ count, amount }: Props) {
  return (
    <div className="relative cursor-pointer">
      <Card className="transition-all hover:shadow-md border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="default" className="text-xs">
              QC
            </Badge>
            <span className="text-lg">⚡</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {count}
            </div>
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
      </Card>
    </div>
  )
}
