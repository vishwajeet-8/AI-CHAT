import { SignIn } from "@clerk/clerk-react";
import "./signInPage.css";

function SignInPage() {
  return <div className="signinPage">SignInPage
  <SignIn path="/sign-in" />
  </div>;
}

export default SignInPage;
