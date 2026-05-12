// src/app/register/page.js
import RegisterForm from "@/components/auth/RegisterForm"

export default async function RegisterPage({ searchParams }) {
  const { email } = await searchParams  // ← await here
  
  return <RegisterForm prefillEmail={email || ""} />
}