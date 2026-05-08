window.ApiClient = (function () {
  const API_BASE = window.API_BASE || "http://localhost:8088";
  const TOKEN_KEY = "accessToken";
  const USER_KEY = "currentUser";

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }

  function setToken(token) {
    if (!token) {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    localStorage.setItem(TOKEN_KEY, token);
  }

  function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch (_) {
      return null;
    }
  }

  function setCurrentUser(user) {
    if (!user) {
      localStorage.removeItem(USER_KEY);
      return;
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  async function request(path, options) {
    const token = getToken();
    const baseHeaders = {
      "Content-Type": "application/json"
    };
    if (token) baseHeaders.Authorization = `Bearer ${token}`;

    const res = await fetch(API_BASE + path, {
      headers: {
        ...baseHeaders,
        ...(options && options.headers ? options.headers : {})
      },
      ...options
    });

    if (!res.ok) {
      let message = "Yeu cau that bai";
      const type = (res.headers.get("content-type") || "").toLowerCase();
      try {
        if (type.includes("application/json")) {
          const data = await res.json();
          message = (data && data.message) ? data.message : message;
        } else {
          const text = (await res.text() || "").trim();
          if (text && !text.startsWith("<!DOCTYPE") && !text.startsWith("<html")) {
            message = text;
          }
        }
      } catch (_) {
      }

      if (message === "Yeu cau that bai" && (res.status === 401 || res.status === 403)) {
        message = "Ban khong co quyen truy cap chuc nang nay hoac phien dang nhap da het han.";
      }

      const error = new Error(message);
      error.status = res.status;
      throw error;
    }

    const type = res.headers.get("content-type") || "";
    if (!type.includes("application/json")) return null;
    const data = await res.json();
    if (data && typeof data === "object" && Object.prototype.hasOwnProperty.call(data, "result")) {
      return data.result;
    }
    return data;
  }

  function encodeQuery(params) {
    const q = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      q.set(k, String(v));
    });
    const s = q.toString();
    return s ? `?${s}` : "";
  }

  return {
    getToken,
    setToken,
    clearAuth,
    getCurrentUser,
    setCurrentUser,
    get(path, params) {
      return request(`${path}${encodeQuery(params)}`, { method: "GET" });
    },
    post(path, body) {
      return request(path, { method: "POST", body: JSON.stringify(body) });
    },
    put(path, body) {
      return request(path, { method: "PUT", body: JSON.stringify(body) });
    },
    patch(path, body) {
      return request(path, { method: "PATCH", body: JSON.stringify(body) });
    },
    upload(path, formData) {
      const token = getToken();
      return fetch(API_BASE + path, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      }).then(async (res) => {
        if (!res.ok) {
          let message = "Yeu cau that bai";
          const type = (res.headers.get("content-type") || "").toLowerCase();
          try {
            if (type.includes("application/json")) {
        const data = await res.json();
              message = (data && data.message) ? data.message : message;
            } else {
              const text = (await res.text() || "").trim();
              if (text && !text.startsWith("<!DOCTYPE") && !text.startsWith("<html")) {
                message = text;
              }
            }
          } catch (_) {}
          if (message === "Yeu cau that bai" && (res.status === 401 || res.status === 403)) {
            message = "Ban khong co quyen truy cap chuc nang nay hoac phien dang nhap da het han.";
          }
          const error = new Error(message);
          error.status = res.status;
          throw error;
        }
        const type = res.headers.get("content-type") || "";
    if (!type.includes("application/json")) return null;
    const data = await res.json();
    if (data && typeof data === "object" && Object.prototype.hasOwnProperty.call(data, "result")) {
      return data.result;
    }
    return data;
      });
    }
  };
})();

