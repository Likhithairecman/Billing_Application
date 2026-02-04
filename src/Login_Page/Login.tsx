import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import "./Login.css";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRules, setShowPasswordRules] = useState(false);

  const allowedDomains = ["@gmail.com", "@yahoo.com"];

  const passwordRules = {
    firstCapital: /^[A-Z]/.test(password),
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordValid =
    passwordRules.firstCapital &&
    passwordRules.minLength &&
    passwordRules.hasNumber &&
    passwordRules.hasSpecial;

  const handleSignIn = () => {
    let hasError = false;

    const isValidDomain = allowedDomains.some((domain) =>
      email.endsWith(domain)
    );

    if (!isValidDomain) {
      setError("Please enter an email address with a valid domain");
      hasError = true;
    } else {
      setError("");
    }

    if (!isPasswordValid) {
      setPasswordError(
        "Please ensure the password meets all the above requirements before continuing."
      );
      hasError = true;
    } else {
      setPasswordError("");
    }

    if (hasError) return;

    // Derive name from email
    const name = email.split('@')[0];

    // Save username to localStorage
    localStorage.setItem('billing_app_username', name.charAt(0).toUpperCase() + name.slice(1));

    console.log("Login successful");
    navigate("/dashboard");
  };

  return (
    <div className="login-container">
      {/* LEFT LOGIN CARD */}
      <div className="login-card">
        <h1 className="app-title">BILLING APPLICATION</h1>


        <label>Email Address <span className="required">*</span></label>
        <div className="input-group">
          <span className="input-icon">✉</span>
          <input
            type="email"
            placeholder="Enter your email address"
            aria-label="Email address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <label>Password <span className="required">*</span></label>

        <div className="input-group">
          <span className="input-icon">🔒</span>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            aria-label="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
              setShowPasswordRules(e.target.value.length > 0);
            }}
          />
          <span
            className="toggle-icon"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈" : "👁"}
          </span>
        </div>

        {showPasswordRules && (
          <div className="password-rules">
            <p className={passwordRules.firstCapital ? "valid" : "invalid"}>
              {passwordRules.firstCapital ? "✓" : "✗"} First letter should be
              capital
            </p>

            <p className={passwordRules.minLength ? "valid" : "invalid"}>
              {passwordRules.minLength ? "✓" : "✗"} Minimum 8 characters
            </p>

            <p className={passwordRules.hasNumber ? "valid" : "invalid"}>
              {passwordRules.hasNumber ? "✓" : "✗"} At least one number
            </p>

            <p className={passwordRules.hasSpecial ? "valid" : "invalid"}>
              {passwordRules.hasSpecial ? "✓" : "✗"} At least one special
              character
            </p>
          </div>
        )}

        {passwordError && (
          <p className="password-warning">{passwordError}</p>
        )}

        <div
          className="forgot-password"
          onClick={() => navigate("/forgot-password")}
        >
          Forgot Password?
        </div>

        <button className="signin-btn" onClick={handleSignIn}>
          Sign In
        </button>

        <p className="signup-text">
          Are you new?{" "}
          <Link to="/signup" className="signup-link">
            Create an Account
          </Link>
        </p>
      </div>

      {/* RIGHT SIDE CONTENT — UNTOUCHED */}
      <div className="welcome-section">
        <h2>WELCOME BACK !</h2>
        <p>Log in to manage billing and invoices efficiently</p>

        <h4 className="recent-title">Recent logins</h4>

        <div className="recent-logins">
          <div className="login-user">
            <img src="/images/staff1.jpg" />
            <p>Staff one</p>
          </div>

          <div className="login-user">
            <img src="/images/staff2.jpg" />
            <p>Staff two</p>
          </div>

          <div className="login-user">
            <img src="/images/staff3.jpg" />
            <p>Staff three</p>
          </div>
        </div>
      </div>

      {/* FOOTER — UNTOUCHED */}
      <div className="login-footer">
        <div className="footer-center">
          By signing in, you are agreeing to our{" "}
          <span className="footer-link">Terms of Use</span> and{" "}
          <span className="footer-link">Privacy Policy</span>
        </div>

        <div className="footer-right">
          Powered by <strong>iRecMan</strong>
        </div>
      </div>
    </div>
  );
};

export default Login;
