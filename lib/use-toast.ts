import { toast as sonner } from "sonner"

type ToastVariant = "default" | "destructive" | "success"

interface ToastProps {
  title: string
  description?: string
  variant?: ToastVariant
}

export function toast({ title, description, variant = "default" }: ToastProps) {
  const variantClass = {
    default: "bg-white text-black border",
    destructive: "bg-destructive text-destructive-foreground border-none",
    success: "bg-green-600 text-white border-none",
  }

  sonner(title, {
    description,
    className: variantClass[variant],
  })
}
