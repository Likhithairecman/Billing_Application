import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

const ResetPin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const PIN_LENGTH = 4;

  const [oldPin, setOldPin] = useState<string[]>(
    Array(PIN_LENGTH).fill("")
  );
  const [newPin, setNewPin] = useState<string[]>(
    Array(PIN_LENGTH).fill("")
  );
  const [error, setError] = useState("");

  if (!email) {
    return <p style={{ textAlign: "center" }}>Invalid access</p>;
  }

  /* 🔹 OTP HANDLERS (ADDED – REQUIRED) */
  const handlePinChange = (
    value: string,
    index: number,
    type: "old" | "new"
  ) => {
    if (!/^\d?$/.test(value)) return;

    const target = type === "old" ? [...oldPin] : [...newPin];
    target[index] = value;

    type === "old" ? setOldPin(target) : setNewPin(target);

    if (value && index < PIN_LENGTH - 1) {
      document
        .getElementById(`${type}-pin-${index + 1}`)
        ?.focus();
    }
  };

  const handlePinKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    type: "old" | "new"
  ) => {
    if (e.key === "Backspace") {
      const target = type === "old" ? oldPin : newPin;
      if (!target[index] && index > 0) {
        document
          .getElementById(`${type}-pin-${index - 1}`)
          ?.focus();
      }
    }
  };

  const handleReset = () => {
    const oldPinValue = oldPin.join("");
    const newPinValue = newPin.join("");

    const stored = localStorage.getItem(`staff_pin_${email}`);
    if (!stored) {
      setError("Staff PIN not found");
      return;
    }

    const parsed = JSON.parse(stored);

    if (parsed.pin !== oldPinValue) {
      setError("Old PIN is incorrect");
      return;
    }

    if (!/^\d{4}$/.test(newPinValue)) {
      setError("New PIN must be exactly 4 digits");
      return;
    }

    localStorage.setItem(
      `staff_pin_${email}`,
      JSON.stringify({ pin: newPinValue })
    );

    alert("PIN reset successful");
    navigate("/");
  };

  return (
    <div className="reset-pin-container">
      <div className="login-card">
        <h2 style={{ textAlign: "center" }}>
          Reset Security PIN
        </h2>

        <label>Old PIN</label>
        <div className="pin-box-container">
          {oldPin.map((digit, index) => (
            <input
              key={index}
              id={`old-pin-${index}`}
              type="password"
              inputMode="numeric"
              maxLength={1}
              className="pin-box"
              value={digit}
              onChange={(e) =>
                handlePinChange(e.target.value, index, "old")
              }
              onKeyDown={(e) =>
                handlePinKeyDown(e, index, "old")
              }
            />
          ))}
        </div>

        <label style={{ marginTop: "12px" }}>
          New PIN
        </label>
        <div className="pin-box-container">
          {newPin.map((digit, index) => (
            <input
              key={index}
              id={`new-pin-${index}`}
              type="password"
              inputMode="numeric"
              maxLength={1}
              className="pin-box"
              value={digit}
              onChange={(e) =>
                handlePinChange(e.target.value, index, "new")
              }
              onKeyDown={(e) =>
                handlePinKeyDown(e, index, "new")
              }
            />
          ))}
        </div>

        {error && <p className="error-text">{error}</p>}

        <button
          className="signin-btn"
          style={{ marginTop: "16px" }}
          onClick={handleReset}
        >
          Reset PIN
        </button>
      </div>
    </div>
  );
};

export default ResetPin;
