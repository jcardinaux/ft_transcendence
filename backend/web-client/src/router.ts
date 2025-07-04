export function navigate(path: string) {
  history.pushState({}, "", path);
  renderRoute(path);
}

export function renderRoute(path: string) {
  const app = document.getElementById("app");
  if (!app) return;

  switch (path) {
    case "/":
    case "/login":
      app.innerHTML =
        "<h2>Login Page</h2><button id='go-profile'>Go to profile</button>";
      document.getElementById("go-profile")?.addEventListener("click", () => {
        navigate("/profile");
      });
      break;

    case "/profile":
      app.innerHTML =
        "<h2>Profile Page</h2><button id='go-login'>Log out</button>";
      document.getElementById("go-login")?.addEventListener("click", () => {
        navigate("/login");
      });
      break;

    default:
      app.innerHTML = "<h2>404 - Page Not Found</h2>";
  }
}
