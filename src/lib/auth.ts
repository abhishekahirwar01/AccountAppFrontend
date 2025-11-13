// NOTE: This is a mock authentication service for demonstration purposes.
// In a real application, you would use a proper authentication library and a secure backend.

import type { User, Client } from "./types";

const USER_STORAGE_KEY = "accountech_pro_user";
// const baseURL = 'https://account-app-backend-eight.vercel.app';
const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

export async function loginMasterAdmin(
  username?: string,
  password?: string,
  captchaToken?: string
): Promise<User | null> {
  if (!username || !password)
    throw new Error("Username and password are required.");

  try {
    const res = await fetch(`${baseURL}/api/master-admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, captchaToken }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    const user: User = {
      name: data.admin.username,
      username: data.admin.username,
      email: `${data.admin.username}@accountech.com`,
      avatar: "/avatars/01.png",
      initials: data.admin.username.substring(0, 2).toUpperCase(),
      role: "master",
      token: data.token,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("token", user.token!);
      localStorage.setItem("role", user.role ?? "");
      localStorage.setItem("username", user.username!);
    }
    return user;
  } catch (error) {
    console.error("API login failed:", error);
    throw error;
  }
}

// export async function loginCustomer(
//   clientUsername: string,
//   password: string
// ): Promise<User> {
//   if (!clientUsername || !password) {
//     throw new Error("Username and password are required.");
//   }

//   const res = await fetch(`${baseURL}/api/clients/login`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ clientUsername, password }),
//   });

//   const data = await res.json();
//   if (!res.ok) {
//     throw new Error(data.message || "Login failed");
//   }

//   // expect your API to return: { token, client: { clientUsername, slug, contactName, email, ... } }
//   const { token, client } = data;

//   const user: User = {
//     name: client.contactName,
//     username: client.clientUsername, // display username
//     email: client.email,
//     avatar: "/avatars/02.png",
//     initials: (client.contactName || "").substring(0, 2).toUpperCase(),
//     role: "customer",
//     token,
//   };

//   if (typeof window !== "undefined") {
//     localStorage.setItem("token", token);
//     localStorage.setItem("role", "customer");
//     localStorage.setItem("username", client.clientUsername);          // display
//     localStorage.setItem("clientUsername", client.clientUsername);    // for logout redirect
//     localStorage.setItem("slug", client.slug ?? client.clientUsername); // for /client-login/[slug]
//     localStorage.setItem("name", client.contactName || "");
//     localStorage.setItem("email", client.email || "");
//   }

//   return user;
// }


// lib/auth.ts
export const normalizeRole = (r?: string) => {
  const s = String(r || "").trim().toLowerCase();
  // map display roles to canonical if you want:
  if (s === "viewer") return "user";
  if (s === "accountant") return "user";
  return s; // "master" | "customer" | "admin" | "manager" | "user" | "client"
};


export function getCurrentUser():
  (User & { clientUsername?: string; slug?: string }) | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");
  const role = normalizeRole(localStorage.getItem("role") || "");

  // be lenient about which username key was stored
  const username =
    localStorage.getItem("username") ||
    localStorage.getItem("userId") ||
    localStorage.getItem("userName") ||
    localStorage.getItem("name") ||
    "";

  if (!token || !role) return null;

  const name = localStorage.getItem("name") || username || "User";
  const email =
    localStorage.getItem("email") ||
    (username ? `${username}@accountech.com` : "user@accountech.com");
  const initials = (name || "U").slice(0, 2).toUpperCase();

  if (role === "master") {
    return { name, username: username || "master", email, avatar: "/avatars/01.png", initials, role: "master" };
  }

  if (role === "customer") {
    const clientUsername = localStorage.getItem("clientUsername") || username || "";
    const slug = localStorage.getItem("slug") || clientUsername || "";
    return {
      name,
      username: username || clientUsername || "customer",
      email,
      avatar: "/avatars/02.png",
      initials,
      role: "customer",
      clientUsername,
      slug,
    };
  }

  // employees: admin / manager / user / client
  if (["admin", "manager", "user", "client"].includes(role)) {
    return { name, username: username || role, email, avatar: "/avatars/03.png", initials, role: role as User["role"] };
  }

  return null;
}


export async function loginClientBySlug(
  clientUsername: string,
  password: string,
  captchaToken?: string
) {
  const res = await fetch(`${baseURL}/api/clients/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientUsername, password, captchaToken }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Login failed");

  const user: User & { slug?: string } = {
    name: data.client.contactName,
    username: data.client.clientUsername,
    email: data.client.email,
    avatar: "/avatars/02.png",
    initials: data.client.contactName.substring(0, 2).toUpperCase(),
    role: "customer",
    token: data.token,
    slug: data.client.slug,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem("token", user.token!);
    localStorage.setItem("role", user.role!);
    localStorage.setItem("username", user.username!);
    localStorage.setItem("name", user.name!);
    localStorage.setItem("email", user.email!);
    localStorage.setItem("tenantSlug", data.client.slug);
  }

  return user;
}


export async function requestClientOtp(clientUsername: string) {
  const res = await fetch(`${baseURL}/api/clients/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientUsername }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to send OTP");
  return data;
}


export async function loginClientBySlugWithOtp(clientUsername: string, otp: string, captchaToken?: string) {
  const res = await fetch(`${baseURL}/api/clients/login-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientUsername, otp, captchaToken }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "OTP login failed");

  // normalize result like your password login
  const user: User & { slug?: string } = {
    name: data?.client?.contactName,
    username: data?.client?.clientUsername,
    email: data?.client?.email,
    role: "customer",
    token: data?.token,
    slug: data?.client?.slug,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem("token", user.token || "");
    localStorage.setItem("role", "customer");
    localStorage.setItem("username", user.username || "");
    localStorage.setItem("clientUsername", user.username || "");
    localStorage.setItem("slug", data?.client?.slug || "");
    localStorage.setItem("tenantSlug", data?.client?.slug || "");
    localStorage.setItem("name", user.name || "");
    localStorage.setItem("email", user.email || "");
  }

  return user;
}


// lib/auth.ts
export async function loginUser(userId: string, password: string, captchaToken?: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, password, captchaToken }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.message || "Login failed");
  }

  const data = await res.json();

  // role can be a string, populated object, or separate field
  const roleRaw =
    (typeof data?.user?.role === "string" && data.user.role) ||
    data?.user?.role?.name ||
    data?.roleName ||
    "";
  const role = normalizeRole(roleRaw);

  // pick a stable username key for storage
  const username =
    data?.user?.userId ||
    data?.user?.userName ||
    data?.user?.username ||
    data?.user?.name ||
    "";

  localStorage.setItem("token", data.token || "");
  localStorage.setItem("role", role);
  localStorage.setItem("username", username);
  localStorage.setItem("name", data?.user?.name || data?.user?.userName || "");
  localStorage.setItem("email", data?.user?.email || "");

  // return a normalized user to the caller
  return { ...data.user, role };
}





export function logout(): string {
  // read BEFORE clearing
  const role = localStorage.getItem("role");

  // clear everything
  localStorage.clear();

  // return the correct target
  return role === "customer" ? "/client-login" : "/login";
}
