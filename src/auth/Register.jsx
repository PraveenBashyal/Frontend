import { useState } from "react";
import { InvestorRegistration } from "../api/ViewerAPI";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [inputList, setInputList] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function change(e) {
    setInputList((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      await InvestorRegistration(inputList);
      setSuccessMessage("Registration successful. You can now log in.");
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      console.log(error);
      if (error.response?.status === 403) {
        setErrorMessage("Some fields are missing or invalid.");
      } else {
        setErrorMessage("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: "560px" }}>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-text">
          Join the platform and start building your investor watchlist.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                className="form-input"
                type="text"
                name="firstName"
                value={inputList.firstName}
                onChange={change}
                placeholder="Enter first name"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                className="form-input"
                type="text"
                name="lastName"
                value={inputList.lastName}
                onChange={change}
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              name="username"
              value={inputList.username}
              onChange={change}
              placeholder="Choose a username"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              name="email"
              value={inputList.email}
              onChange={change}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="form-input"
                type="text"
                name="phoneNumber"
                value={inputList.phoneNumber}
                onChange={change}
                placeholder="Enter phone number"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                className="form-input"
                type="date"
                name="dateOfBirth"
                value={inputList.dateOfBirth}
                onChange={change}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              name="password"
              value={inputList.password}
              onChange={change}
              placeholder="Create a password"
              required
            />
          </div>

          {errorMessage && <p className="error-text">{errorMessage}</p>}
          {successMessage && <p className="success-text">{successMessage}</p>}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="form-hint">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}