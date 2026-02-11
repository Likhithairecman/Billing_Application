import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SignUp.css";

const Signup = () => {
  const navigate = useNavigate();

  /* 🔹 ROLE ID GENERATOR (ADDED) */
  const generateRoleId = (role: string) => {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `${role.toUpperCase()}-${random}`;
  };

  const [form, setForm] = useState({
    salutation: "Mr",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    staffPin: "",

    /* 🔹 ADDED */
    role: "staff",
    roleId: generateRoleId("staff"),
  });

  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  /* 🔹 AUTO UPDATE ROLE ID WHEN ROLE CHANGES (ADDED) */
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      roleId: generateRoleId(prev.role),
    }));
  }, [form.role]);

  /* 🔐 PASSWORD RULES */
  const passwordRules = {
    firstCapital: /^[A-Z]/.test(form.password),
    minLength: form.password.length >= 8,
    hasNumber: /\d/.test(form.password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(form.password),
  };

  const isPasswordValid =
    passwordRules.firstCapital &&
    passwordRules.minLength &&
    passwordRules.hasNumber &&
    passwordRules.hasSpecial;

  const showPasswordMatchMsg = form.confirmPassword.length > 0;
  const isPasswordMatch =
    form.password.length > 0 &&
    form.password === form.confirmPassword;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = () => {
    const errs: string[] = [];

    if (!form.firstName) errs.push("First name required");
    if (!form.lastName) errs.push("Last name required");

    if (!form.email.endsWith("@gmail.com") && !form.email.endsWith("@yahoo.com"))
      errs.push("Enter a valid email domain");

    if (form.phone.length !== 10)
      errs.push("Phone number must be 10 digits");

    if (!isPasswordValid)
      errs.push("Password does not meet all requirements");

    if (!isPasswordMatch)
      errs.push("Passwords do not match");

    if (!/^\d{4}$/.test(form.staffPin))
      errs.push("Staff PIN must be exactly 4 digits");

    setErrors(errs);

    if (errs.length === 0) {
      localStorage.setItem(
        `staff_pin_${form.email}`,
        JSON.stringify({ pin: form.staffPin })
      );

      alert("Staff created successfully");
      navigate("/");
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2>Create Account</h2>

        {/* ROW 1 */}
        <div className="row-3">
          <div>
            <label>Salutation</label>
            <select
              name="salutation"
              value={form.salutation}
              onChange={handleChange}
            >
              <option>Mr</option>
              <option>Ms</option>
              <option>Mrs</option>
              <option>Miss</option>
            </select>
          </div>

          <div>
            <label>First Name</label>
            <input
              name="firstName"
              placeholder="Enter First Name"
              value={form.firstName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Last Name</label>
            <input
              name="lastName"
              placeholder="Enter Last Name"
              value={form.lastName}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* 🔹 ROLE SECTION (ADDED — SAME STYLE) */}
        <div className="row-2">
          <div>
            <label>Role</label>
            <div className="input-group">
              <span className="icon">👤</span>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  paddingLeft: "44px",
                  fontSize: "14px",
                  appearance: "none",
                  cursor: "pointer",
                }}
              >
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>

          <div>
            <label>Role ID</label>
            <div className="input-group">
              <span className="icon">🆔</span>
              <input value={form.roleId} readOnly />
            </div>
          </div>
        </div>

        {/* ROW 2 */}
        <div className="row-2">
          <div>
            <label>Phone Number</label>
            <div className="phone-group">
              <span className="country-code">+91</span>
              <input
                name="phone"
                placeholder="Enter 10 digit number"
                maxLength={10}
                value={form.phone}
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value)) {
                    setForm({ ...form, phone: e.target.value });
                  }
                }}
              />
            </div>
          </div>

          <div>
            <label>Email</label>
            <div className="input-group">
              <span className="icon">📧</span>
              <input
                name="email"
                placeholder="Enter email address"
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* 🔒 PASSWORD, CONFIRM PASSWORD, STAFF PIN */}
        {/* ⛔ UNCHANGED — YOUR ORIGINAL CODE CONTINUES */}

        {/* (rest of your code remains exactly the same) */}


        {/* PASSWORD */}
        <div className="row-2">
          <div>
            <label>Password *</label>
            <div className="input-group">
              <span className="icon">🔒</span>
              <input
                type={showPwd ? "text" : "password"}
                name="password"
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
              />
              <span className="toggle" onClick={() => setShowPwd(!showPwd)}>
                {showPwd ? "🙈" : "👁️"}
              </span>
            </div>

            {form.password && (
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
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label>Confirm Password</label>
            <div className="input-group">
              <span className="icon">🔒</span>
              <input
                type={showConfirmPwd ? "text" : "password"}
                name="confirmPassword"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={handleChange}
              />
              <span
                className="toggle"
                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
              >
                {showConfirmPwd ? "🙈" : "👁️"}
              </span>
            </div>

            {showPasswordMatchMsg && (
              <p className={isPasswordMatch ? "match-success" : "match-error"}>
                {isPasswordMatch
                  ? "✓ Passwords match"
                  : "✗ Passwords do not match"}
              </p>
            )}
          </div>
        </div>

        {/* STAFF PIN */}
        <div className="row-2">
          <div>
            <label>Staff Security PIN</label>
            <div className="input-group">
              <span className="icon">🔐</span>
              <input
                type={showPin ? "text" : "password"}
                name="staffPin"
                placeholder="Enter 4-digit PIN"
                maxLength={4}
                value={form.staffPin}
                onChange={handleChange}
              />
              <span className="toggle" onClick={() => setShowPin(!showPin)}>
                {showPin ? "🙈" : "👁️"}
              </span>
            </div>
          </div>
        </div>

        {errors.map((err, i) => (
          <p key={i} className="error-text">
            {err}
          </p>
        ))}

        <button className="signup-btn" onClick={handleSubmit}>
          Sign Up
        </button>

        <p className="centered">
          Already a user?{" "}
          <Link to="/" className="signin-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
