import { useEffect, useState } from "react";
import {
  createActivity,
  deleteActivity,
  fetchActivities,
  fetchCurrentUser,
  loginUser,
  registerUser
} from "./api";

const CATEGORIES = ["Academic", "Technical", "Cultural", "Sports"];
const FILTER_OPTIONS = ["All", ...CATEGORIES];
const AUTH_MODES = {
  login: "login",
  register: "register"
};
const STORAGE_KEYS = {
  token: "studor_token",
  theme: "studor_theme"
};
const THEME_ICONS = {
  light: "\u263E",
  dark: "\u2600"
};
const EMPTY_ACTIVITY_FORM = {
  name: "",
  category: CATEGORIES[0],
  date: ""
};
const EMPTY_AUTH_FORM = {
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

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function ThemeToggleButton({ theme, onToggle }) {
  const nextModeLabel = theme === "light" ? "Switch to dark mode" : "Switch to light mode";

  return (
    <button className="secondary-button" onClick={onToggle} type="button">
      <span aria-hidden="true">{THEME_ICONS[theme]}</span>
      <span className="sr-only">{nextModeLabel}</span>
    </button>
  );
}

function FeedbackMessage({ error, notice }) {
  if (error) {
    return <p className="message error">{error}</p>;
  }

  if (notice) {
    return <p className="message success">{notice}</p>;
  }

  return null;
}

function AuthScreen({
  authError,
  authForm,
  authLoading,
  authMode,
  notice,
  onAuthModeChange,
  onInputChange,
  onSubmit,
  onToggleTheme,
  theme
}) {
  const isLoginMode = authMode === AUTH_MODES.login;

  return (
    <main className="page-shell">
      <section className="auth-card">
        <div className="header-row">
          <div className="section-copy">
            <p className="eyebrow">Studor Builder Screening Project</p>
            <h1>PathCredit Logger</h1>
            <p className="muted">
              Students can sign in, log activities, and filter their own feed by category.
            </p>
          </div>

          <ThemeToggleButton onToggle={onToggleTheme} theme={theme} />
        </div>

        <div className="toggle-row" role="tablist" aria-label="Authentication mode">
          <button
            className={isLoginMode ? "toggle active" : "toggle"}
            onClick={() => onAuthModeChange(AUTH_MODES.login)}
            type="button"
          >
            Login
          </button>
          <button
            className={!isLoginMode ? "toggle active" : "toggle"}
            onClick={() => onAuthModeChange(AUTH_MODES.register)}
            type="button"
          >
            Register
          </button>
        </div>

        <form className="panel" onSubmit={onSubmit}>
          {!isLoginMode ? (
            <label className="field">
              <span>Name</span>
              <input
                name="name"
                onChange={onInputChange}
                placeholder="Aarav Sharma"
                required
                value={authForm.name}
              />
            </label>
          ) : null}

          <label className="field">
            <span>Email</span>
            <input
              name="email"
              onChange={onInputChange}
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
              onChange={onInputChange}
              placeholder="Minimum 6 characters"
              required
              type="password"
              value={authForm.password}
            />
          </label>

          <FeedbackMessage error={authError} notice={notice} />

          <button className="primary-button form-submit" disabled={authLoading} type="submit">
            {authLoading ? "Please wait..." : isLoginMode ? "Login" : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}

function ActivityFormPanel({
  activityError,
  activityForm,
  activityLoading,
  notice,
  onInputChange,
  onSubmit
}) {
  return (
    <section className="panel">
      <div className="section-copy">
        <h2>Log an activity</h2>
      </div>

      <form className="stack" onSubmit={onSubmit}>
        <label className="field">
          <span>Activity name</span>
          <input
            name="name"
            onChange={onInputChange}
            placeholder="DSA practice session"
            required
            value={activityForm.name}
          />
        </label>

        <label className="field">
          <span>Category</span>
          <select name="category" onChange={onInputChange} required value={activityForm.category}>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Date</span>
          <input
            max={getTodayDate()}
            name="date"
            onChange={onInputChange}
            required
            type="date"
            value={activityForm.date}
          />
        </label>

        <FeedbackMessage error={activityError} notice={notice} />

        <button className="primary-button" disabled={activityLoading} type="submit">
          {activityLoading ? "Saving..." : "Add activity"}
        </button>
      </form>
    </section>
  );
}

function ActivityFeedPanel({
  activities,
  deletingActivityId,
  feedError,
  feedLoading,
  filter,
  notice,
  onDelete,
  onFilterChange
}) {
  return (
    <section className="panel">
      <div className="feed-header">
        <div className="section-copy">
          <h2>Activity feed</h2>
          <p className="muted">Filter the list by category. Each student only sees their own entries.</p>
        </div>

        <label className="field compact">
          <span>Filter</span>
          <select onChange={onFilterChange} value={filter}>
            {FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="feed-list">
        <FeedbackMessage error={feedError} notice={notice} />
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
          activities.map((activity) => {
            const isDeleting = deletingActivityId === activity.id;

            return (
              <article className="activity-item" key={activity.id}>
                <div>
                  <h3>{activity.name}</h3>
                  <p className="muted">{formatDate(activity.date)}</p>
                </div>

                <div className="activity-actions">
                  <span className="pill">{activity.category}</span>
                  <button
                    className="danger-button"
                    disabled={isDeleting}
                    onClick={() => onDelete(activity.id)}
                    type="button"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            );
          })}
      </div>
    </section>
  );
}

function Dashboard({
  activities,
  activityError,
  activityForm,
  activityLoading,
  deletingActivityId,
  feedLoading,
  filter,
  notice,
  onActivityInputChange,
  onActivitySubmit,
  onDeleteActivity,
  onFilterChange,
  onLogout,
  onToggleTheme,
  theme,
  user
}) {
  return (
    <main className="page-shell">
      <section className="app-card">
        <header className="top-bar">
          <div>
            <p className="eyebrow">Logged in as</p>
            <h1>{user.name}</h1>
            <p className="muted">{user.email}</p>
          </div>

          <div className="action-row">
            <ThemeToggleButton onToggle={onToggleTheme} theme={theme} />
            <button className="secondary-button" onClick={onLogout} type="button">
              Logout
            </button>
          </div>
        </header>

        <div className="layout-grid">
          <ActivityFormPanel
            activityError={activityError}
            activityForm={activityForm}
            activityLoading={activityLoading}
            notice={notice}
            onInputChange={onActivityInputChange}
            onSubmit={onActivitySubmit}
          />
          <ActivityFeedPanel
            activities={activities}
            deletingActivityId={deletingActivityId}
            feedError={activityError}
            feedLoading={feedLoading}
            filter={filter}
            notice={notice}
            onDelete={onDeleteActivity}
            onFilterChange={onFilterChange}
          />
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEYS.token) || "");
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEYS.theme) || "light");
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState("All");
  const [authMode, setAuthMode] = useState(AUTH_MODES.login);
  const [authForm, setAuthForm] = useState(EMPTY_AUTH_FORM);
  const [activityForm, setActivityForm] = useState(EMPTY_ACTIVITY_FORM);
  const [authLoading, setAuthLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [feedLoading, setFeedLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [activityError, setActivityError] = useState("");
  const [notice, setNotice] = useState("");
  const [deletingActivityId, setDeletingActivityId] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNotice("");
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [notice]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setActivities([]);
      return;
    }

    let isCancelled = false;

    async function loadSession() {
      try {
        const [{ user: currentUser }, { activities: currentActivities }] = await Promise.all([
          fetchCurrentUser(token),
          fetchActivities(token, filter)
        ]);

        if (isCancelled) {
          return;
        }

        setUser(currentUser);
        setActivities(currentActivities);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        clearSession();
        setAuthError(error.message);
      }
    }

    loadSession();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isCancelled = false;

    async function loadActivities() {
      setFeedLoading(true);

      try {
        const { activities: nextActivities } = await fetchActivities(token, filter);

        if (!isCancelled) {
          setActivities(nextActivities);
        }
      } catch (error) {
        if (!isCancelled) {
          setActivityError(error.message);
        }
      } finally {
        if (!isCancelled) {
          setFeedLoading(false);
        }
      }
    }

    loadActivities();

    return () => {
      isCancelled = true;
    };
  }, [filter, token]);

  function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.token);
    setToken("");
    setUser(null);
  }

  function handleThemeToggle() {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  }

  function handleAuthModeChange(nextMode) {
    setAuthMode(nextMode);
    setAuthError("");
    setNotice("");
  }

  function handleAuthInputChange(event) {
    const { name, value } = event.target;
    setAuthForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function handleActivityInputChange(event) {
    const { name, value } = event.target;
    setActivityForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthError("");
    setNotice("");
    setAuthLoading(true);

    const requestBody =
      authMode === AUTH_MODES.login
        ? { email: authForm.email, password: authForm.password }
        : authForm;
    const submitAuth = authMode === AUTH_MODES.login ? loginUser : registerUser;

    try {
      const { token: nextToken, user: nextUser } = await submitAuth(requestBody);

      localStorage.setItem(STORAGE_KEYS.token, nextToken);
      setToken(nextToken);
      setUser(nextUser);
      setAuthForm(EMPTY_AUTH_FORM);
      setNotice(authMode === AUTH_MODES.login ? "Welcome back." : "Account created successfully.");
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

      setActivities((currentActivities) => {
        if (filter !== "All" && filter !== activity.category) {
          return currentActivities;
        }

        return [activity, ...currentActivities];
      });

      setActivityForm(EMPTY_ACTIVITY_FORM);
      setNotice("Activity logged successfully.");
    } catch (error) {
      setActivityError(error.message);
    } finally {
      setActivityLoading(false);
    }
  }

  async function handleDeleteActivity(activityId) {
    setActivityError("");
    setNotice("");
    setDeletingActivityId(activityId);

    try {
      await deleteActivity(token, activityId);
      setActivities((currentActivities) =>
        currentActivities.filter((activity) => activity.id !== activityId)
      );
      setNotice("Activity deleted.");
    } catch (error) {
      setActivityError(error.message);
    } finally {
      setDeletingActivityId("");
    }
  }

  if (!token || !user) {
    return (
      <AuthScreen
        authError={authError}
        authForm={authForm}
        authLoading={authLoading}
        authMode={authMode}
        notice={notice}
        onAuthModeChange={handleAuthModeChange}
        onInputChange={handleAuthInputChange}
        onSubmit={handleAuthSubmit}
        onToggleTheme={handleThemeToggle}
        theme={theme}
      />
    );
  }

  return (
    <Dashboard
      activities={activities}
      activityError={activityError}
      activityForm={activityForm}
      activityLoading={activityLoading}
      deletingActivityId={deletingActivityId}
      feedLoading={feedLoading}
      filter={filter}
      notice={notice}
      onActivityInputChange={handleActivityInputChange}
      onActivitySubmit={handleActivitySubmit}
      onDeleteActivity={handleDeleteActivity}
      onFilterChange={(event) => setFilter(event.target.value)}
      onLogout={clearSession}
      onToggleTheme={handleThemeToggle}
      theme={theme}
      user={user}
    />
  );
}
