import { Suspense } from "react";
import AuthLayout from "@/app/(auth)/layout";
import AdminResetPasswordForm from "./reset-password-form";

export default function AdminResetPasswordPage() {
  return <AuthLayout><Suspense><AdminResetPasswordForm /></Suspense></AuthLayout>;
}
