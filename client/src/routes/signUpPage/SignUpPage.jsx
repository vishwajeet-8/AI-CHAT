import { SignUp } from "@clerk/clerk-react";
import "./signUpPage.css";

function SignUpPage() {
  return (
    <div className="signupPage">
      <SignUp path="/sign-up" signInUrl="/sign-in" />
    </div>
  );
}

export default SignUpPage;
