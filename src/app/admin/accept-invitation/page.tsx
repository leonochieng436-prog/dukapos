import { Suspense } from "react";
import AuthLayout from "@/app/(auth)/layout";
import AdminInvitationForm from "./invitation-form";

export default function AcceptAdminInvitationPage() {
  return <AuthLayout><Suspense><AdminInvitationForm /></Suspense></AuthLayout>;
}
