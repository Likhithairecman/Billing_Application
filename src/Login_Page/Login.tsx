import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Login.css";

interface Staff {
  id: string;        // email
  name: string;
  avatar: string;
  pin: string;       // staff-specific PIN
}

const PIN_LENGTH = 4;

const Login = () => {
  const navigate = useNavigate();

  // ---------- Normal login ----------
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRules, setShowPasswordRules] = useState(false);

  // ---------- Recent login ----------
  const [recentStaff, setRecentStaff] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // ---------- PIN modal ----------
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [pinError, setPinError] = useState("");

  const allowedDomains = ["@gmail.com", "@yahoo.com"];

  // ---------- Password rules ----------
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

  // ---------- Get PIN stored during Signup ----------
  const getStoredPinForStaff = (email: string): string | null => {
    const data = localStorage.getItem(`staff_pin_${email}`);
    if (!data) return null;

    try {
      return JSON.parse(data).pin;
    } catch {
      return null;
    }
  };

  // ---------- Avatar helper ----------
  const getAvatarForStaff = (email: string) => {
    const avatars = [
      "/images/staff1.jpg",
      "/images/staff2.jpg",
      "/images/staff3.jpg",
    ];
    return avatars[email.charCodeAt(0) % avatars.length];
  };

  // ---------- Load recent logins ----------
  useEffect(() => {
    const stored = localStorage.getItem("recentLogins");
    if (stored) {
      setRecentStaff(JSON.parse(stored));
    }
  }, []);

  // ---------- Update recent logins ----------
  const updateRecentLogins = (staff: Staff) => {
    const updated = [
      staff,
      ...recentStaff.filter((s) => s.id !== staff.id),
    ].slice(0, 3);

    setRecentStaff(updated);
    localStorage.setItem("recentLogins", JSON.stringify(updated));
  };

  // ---------- Normal Sign In ----------
  const handleSignIn = () => {
    let hasError = false;

    if (!allowedDomains.some((d) => email.endsWith(d))) {
      setError("Please enter an email address with a valid domain");
      hasError = true;
    } else setError("");

    if (!isPasswordValid) {
      setPasswordError(
        "Please ensure the password meets all the requirements"
      );
      hasError = true;
    } else setPasswordError("");

    if (hasError) return;

    const storedPin = getStoredPinForStaff(email);
    if (!storedPin) {
      alert("Security PIN not found. Please contact admin.");
      return;
    }

    const staff: Staff = {
      id: email,
      name: email.split("@")[0],
      avatar: getAvatarForStaff(email),
      pin: storedPin,
    };

    updateRecentLogins(staff);
    navigate("/dashboard");
  };

  // ---------- Recent staff click ----------
  const handleStaffClick = (staff: Staff) => {
    setSelectedStaff(staff);
    setPin(Array(PIN_LENGTH).fill(""));
    setPinError("");
    setShowPinModal(true);
  };

  // ---------- PIN handlers ----------
  const handlePinChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const updated = [...pin];
    updated[index] = value;
    setPin(updated);

    if (value && index < PIN_LENGTH - 1) {
      document.getElementById(`pin-${index + 1}`)?.focus();
    }
  };

  const handlePinKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      document.getElementById(`pin-${index - 1}`)?.focus();
    }
  };

  // ---------- Verify PIN ----------
  const verifyPin = () => {
  if (!selectedStaff) return;

  const storedPin = getStoredPinForStaff(selectedStaff.id);

  if (!storedPin) {
    setPinError("Security PIN not found");
    return;
  }

  if (pin.join("") === storedPin) {
    // ✅ Update recent login with latest PIN
    updateRecentLogins({
      ...selectedStaff,
      pin: storedPin,
    });

    setShowPinModal(false);
    navigate("/dashboard");
  } else {
    setPinError("Invalid Security PIN");
  }
};


  return (
    <div className="login-container">
  <div className="login-form-wrapper">
    <div className="login-card">

        <h1 className="app-title">BILLING APPLICATION</h1>

        <label>
          Email Address <span className="required">*</span>
        </label>
        <div className="input-group">
          <span className="input-icon">✉</span>
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <label>
          Password <span className="required">*</span>
        </label>
        <div className="input-group">
          <span className="input-icon">🔒</span>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
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
              ✓ First letter should be capital
            </p>
            <p className={passwordRules.minLength ? "valid" : "invalid"}>
              ✓ Minimum 8 characters
            </p>
            <p className={passwordRules.hasNumber ? "valid" : "invalid"}>
              ✓ At least one number
            </p>
            <p className={passwordRules.hasSpecial ? "valid" : "invalid"}>
              ✓ At least one special character
            </p>
          </div>
        )}

        {passwordError && (
          <p className="password-warning">{passwordError}</p>
        )}

        <Link to="/forgot-password" className="forgot-password">
        Forgot Password?
        </Link>


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
      </div>

      {/* RIGHT SECTION */}
      <div className="welcome-section">
        <h2>WELCOME BACK !</h2>
        <p>Log in to manage billing and invoices efficiently</p>

        <h4 className="recent-title">Recent logins</h4>

        <div className="recent-logins">
          {recentStaff.length === 0 && (
            <p>Please login using email and password</p>
          )}

          {recentStaff.map((staff) => (
            <div
              key={staff.id}
              className="login-user"
              onClick={() => handleStaffClick(staff)}
            >
              <img src={staff.avatar} alt={staff.name} />
              <p>{staff.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PIN MODAL */}
      {showPinModal && (
        <div className="pin-overlay">
          <div className="pin-modal">
            <h3 className="pin-title">Enter Security PIN</h3>

            <div className="pin-box-container">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  id={`pin-${index}`}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  className="pin-box"
                  value={digit}
                  onChange={(e) =>
                    handlePinChange(e.target.value, index)
                  }
                  onKeyDown={(e) =>
                    handlePinKeyDown(e, index)
                  }
                />
              ))}
            </div>

            <p
  style={{
    marginTop: "12px",
    color: "#2e7d32",
    cursor: "pointer",
    fontSize: "14px",
    textAlign: "center",
    fontWeight: 500,
  }}
  onClick={() => {
    setShowPinModal(false);
    navigate("/reset-pin", {
      state: { email: selectedStaff?.id },
    });
  }}
>
  Reset PIN?
</p>


            {pinError && <p className="error-text">{pinError}</p>}

            <div className="pin-btn-row">
              <button
                className="signin-btn verify-btn"
                onClick={verifyPin}
              >
                Verify
              </button>

              <button
                className="signin-btn cancel-btn"
                onClick={() => {
                  setShowPinModal(false);
                  setPin(Array(PIN_LENGTH).fill(""));
                  setPinError("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
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
