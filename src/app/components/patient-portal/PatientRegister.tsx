import React, { useState } from "react";
import apiService from "../../../../services/apiService";

interface RegisterFormData {
  fullname: string;
  email: string;
  password: string;
  gender: string;
  date_of_birth: string;
  phone_number: string;
}

export const RegisterScreen: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    fullname: "",
    email: "",
    password: "",
    gender: "male",
    date_of_birth: "",
    phone_number: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiService(
        "/kch-api/api/v1/auth/register",
        "POST",
        formData
      );

      if (res?.code === 200 || res?.msg === "success" || res?.status === 200) {
        window.location.href = "/patient/login";
      }
    } catch (err: any) {
      setError(
        err.message || "ការចុះឈ្មោះមិនបានសម្រេច សូមព្យាយាមម្តងទៀត។"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
          បង្កើតគណនីថ្មី
        </h2>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              គោត្តនាម និងនាម (ឈ្មោះពេញ)
            </label>
            <input
              type="text"
              name="fullname"
              required
              value={formData.fullname}
              onChange={handleChange}
              placeholder="ឧ. ណារិទ្ធ"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              អ៊ីមែល
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="ឧ. narith@gmail.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              លេខទូរស័ព្ទ
            </label>
            <input
              type="tel"
              name="phone_number"
              required
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="ឧ. 0123456789"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ភេទ
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="male">ប្រុស</option>
                <option value="female">ស្រី</option>
                <option value="other">ផ្សេងទៀត</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ថ្ងៃខែឆ្នាំកំណើត
              </label>
              <input
                type="date"
                name="date_of_birth"
                required
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ពាក្យសម្ងាត់
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "កំពុងចុះឈ្មោះ..." : "ចុះឈ្មោះ"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          មានគណនីរួចហើយមែនទេ?{" "}
          <a href="/patient/login" className="text-blue-600 hover:underline font-medium">
            ចូលប្រើប្រាស់
          </a>
        </p>
      </div>
    </div>
  );
};