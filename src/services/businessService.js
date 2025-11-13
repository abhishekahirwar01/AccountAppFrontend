// services/businessService.js

export const fetchBusinesses = async () => {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Authentication token not found.");
  }

  try {
    const response = await fetch(`${baseURL}/api/companies/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch businesses.");
    }

    const data = await response.json();
    return data.companies || [];
  } catch (error) {
    throw new Error(error.message || "Something went wrong while fetching businesses.");
  }
};
