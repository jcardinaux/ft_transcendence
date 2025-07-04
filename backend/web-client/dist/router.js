export function navigate(path) {
    history.pushState({}, "", path);
    renderRoute(path);
}
export function renderRoute(path) {
    var _a, _b;
    const app = document.getElementById("app");
    if (!app)
        return;
    switch (path) {
        case "/":
        case "/login":
            app.innerHTML =
                "<h2>Login Page</h2><button id='go-profile'>Go to profile</button>";
            (_a = document.getElementById("go-profile")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
                navigate("/profile");
            });
            break;
        case "/profile":
            app.innerHTML =
                "<h2>Profile Page</h2><button id='go-login'>Log out</button>";
            (_b = document.getElementById("go-login")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", () => {
                navigate("/login");
            });
            break;
        default:
            app.innerHTML = "<h2>404 - Page Not Found</h2>";
    }
}
