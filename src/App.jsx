import { useEffect, useState } from "react";
import {
  createActivity,
  fetchActivities,
  fetchCurrentUser,
  loginUser,
  registerUser
} from "./api";

const categories = ["Academic", "Technical", "Cultural", "Sports"];
const filters = ["All", ...categories];
const authModes = {
  login: "login",
  register: "register"
};

const emptyActivityForm = {
  name: "",
  category: categories[0],
  date: ""
};

const emptyAuthForm = {
  name: "",
  email: "",
  password: ""
};

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("studor_token") || "");
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState("All");
  const [authMode, setAuthMode] = useState(authModes.login);
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [activityForm, setActivityForm] = useState(emptyActivityForm);
  const [authLoading, setAuthLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [feedLoading, setFeedLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [activityError, setActivityError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!token) {
      setUser(null);
      setActivities([]);
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      try {
        const [{ user: currentUser }, { activities: nextActivities }] = await Promise.all([
          fetchCurrentUser(token),
          fetchActivities(token, filter)
        ]);

        if (cancelled) {
          return;
        }

        setUser(currentUser);
        setActivities(nextActivities);
      } catch (error) {
        if (cancelled) {
          return;
        }

        clearSession();
        setAuthError(error.message);
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    async function loadActivities() {
      setFeedLoading(true);

      try {
        const { activities: nextActivities } = await fetchActivities(token, filter);

        if (!cancelled) {
          setActivities(nextActivities);
        }
      } catch (error) {
        if (!cancelled) {
          setActivityError(error.message);
        }
      } finally {
        if (!cancelled) {
          setFeedLoading(false);
        }
      }
    }

    loadActivities();

    return () => {
      cancelled = true;
    };
  }, [filter, token]);

  function clearSession() {
    localStorage.removeItem("studor_token");
    setToken("");
    setUser(null);
  }

  function updateAuthForm(event) {
    const { name, value } = event.target;
    setAuthForm((current) => ({ ...current, [name]: value }));
  }

  function updateActivityForm(event) {
    const { name, value } = event.target;
    setActivityForm((current) => ({ ...current, [name]: value }));
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthError("");
    setNotice("");
    setAuthLoading(true);

    try {
      const action = authMode === authModes.login ? loginUser : registerUser;
      const payload = authMode === authModes.login
        ? { email: authForm.email, password: authForm.password }
        : authForm;
      const result = await action(payload);

      localStorage.setItem("studor_token", result.token);
      setToken(result.token);
      setUser(result.user);
      setAuthForm(emptyAuthForm);
      setNotice(authMode === authModes.login ? "Welcome back." : "Account created successfully.");
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleActivitySubmit(event) {
    event.preventDefault();
    setActivityError("");
    setNotice("");
    setActivityLoading(true);

    try {
      const { activity } = await createActivity(token, activityForm);
      setActivities((current) => {
        const nextActivities = [activity, ...current];
        return filter === "All" || filter === activity.category
          ? nextActivities
          : current;
      });
      setActivityForm(emptyActivityForm);
      setNotice("Activity logged successfully.");
    } catch (error) {
      setActivityError(error.message);
    } finally {
      setActivityLoading(false);
    }
  }

  if (!token || !user) {
    return (
      <main className="page-shell">
        <section className="auth-card">
          <div className="section-copy">
            <p className="eyebrow">Studor Builder Screening Project</p>
            <h1>PathCredit Logger</h1>
            <p className="muted">
              Students can sign in, log activities, and filter their own feed by category.
            </p>
          </div>

          <div className="toggle-row" role="tablist" aria-label="Authentication mode">
            <button
              className={authMode === authModes.login ? "toggle active" : "toggle"}
              onClick={() => setAuthMode(authModes.login)}
              type="button"
            >
              Login
            </button>
            <button
              className={authMode === authModes.register ? "toggle active" : "toggle"}
              onClick={() => setAuthMode(authModes.register)}
              type="button"
            >
              Register
            </button>
          </div>

          <form className="panel" onSubmit={handleAuthSubmit}>
            {authMode === authModes.register && (
              <label className="field">
                <span>Name</span>
                <input
                  name="name"
                  onChange={updateAuthForm}
                  placeholder="Aarav Sharma"
                  required
                  value={authForm.name}
                />
              </label>
            )}

            <label className="field">
              <span>Email</span>
              <input
                name="email"
                onChange={updateAuthForm}
                placeholder="student@example.com"
                required
                type="email"
                value={authForm.email}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                name="password"
                onChange={updateAuthForm}
                placeholder="Minimum 6 characters"
                required
                type="password"
                value={authForm.password}
              />
            </label>

            {authError ? <p className="message error">{authError}</p> : null}
            {notice ? <p className="message success">{notice}</p> : null}

            <button className="primary-button" disabled={authLoading} type="submit">
              {authLoading ? "Please wait..." : authMode === authModes.login ? "Login" : "Create account"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="app-card">
        <header className="top-bar">
          <div>
            <p className="eyebrow">Logged in as</p>
            <h1>{user.name}</h1>
            <p className="muted">{user.email}</p>
          </div>

          <button className="secondary-button" onClick={clearSession} type="button">
            Logout
          </button>
        </header>

        <div className="layout-grid">
          <section className="panel">
            <div className="section-copy">
              <h2>Log an activity</h2>
              <p className="muted">Keep the form small and focused. New entries appear without a page reload.</p>
            </div>

            <form className="stack" onSubmit={handleActivitySubmit}>
              <label className="field">
                <span>Activity name</span>
                <input
                  name="name"
                  onChange={updateActivityForm}
                  placeholder="DSA practice session"
                  required
                  value={activityForm.name}
                />
              </label>

              <label className="field">
                <span>Category</span>
                <select name="category" onChange={updateActivityForm} required value={activityForm.category}>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Date</span>
                <input name="date" max={new Date().toISOString().split("T")[0]} onChange={updateActivityForm} required type="date" value={activityForm.date} />
              </label>

              {activityError ? <p className="message error">{activityError}</p> : null}
              {notice ? <p className="message success">{notice}</p> : null}

              <button className="primary-button" disabled={activityLoading} type="submit">
                {activityLoading ? "Saving..." : "Add activity"}
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="feed-header">
              <div className="section-copy">
                <h2>Activity feed</h2>
                <p className="muted">Filter the list by category. Each student only sees their own entries.</p>
              </div>

              <label className="field compact">
                <span>Filter</span>
                <select onChange={(event) => setFilter(event.target.value)} value={filter}>
                  {filters.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="feed-list">
              {feedLoading ? <p className="muted">Loading activities...</p> : null}

              {!feedLoading && activities.length === 0 ? (
                <div className="empty-state">
                  <h3>No activities found</h3>
                  <p className="muted">
                    {filter === "All"
                      ? "Start by logging your first activity."
                      : "There are no activities in this category yet."}
                  </p>
                </div>
              ) : null}

              {!feedLoading &&
                activities.map((activity) => (
                  <article className="activity-item" key={activity.id}>
                    <div>
                      <h3>{activity.name}</h3>
                      <p className="muted">{formatDate(activity.date)}</p>
                    </div>
                    <span className="pill">{activity.category}</span>
                  </article>
                ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
