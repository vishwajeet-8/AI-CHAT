import { SignUp } from "@clerk/clerk-react";
import "./signUpPage.css";

function SignUpPage() {
  return (
    <div className="signupPage">
      SignUpPage
      <SignUp path="/sign-up" />
    </div>
  );
}

export default SignUpPage;
