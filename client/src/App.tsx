import { useState } from "react";

const App = () => {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const api = await fetch("http://localhost:4001/download", {
      method: "POST",
      body: JSON.stringify({ url }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await api.json();
    console.log(data);

    const anchor = document.createElement("a");
    anchor.href = data.downloadUrl;
    anchor.download = data.fileName;
    anchor.click();

    setLoading(false);
  };

  return (
    <main className="flex flex-col items-center max-w-4xl gap-4 px-3 py-10 mx-auto border-t-4 border-indigo-500 lg:px-0">
      <header className="text-center ">
        <h1 className="text-3xl font-semibold">Social Media Downloader</h1>
        <h3 className="text-xl">
          Download video from your favorite social media platform like youtube,
          facebook, instagram, tiktok and much more....
        </h3>
      </header>

      <form onSubmit={handleSubmit} className="flex w-full gap-2">
        <input
          type="url"
          className="w-full p-2 border-2 border-gray-300 rounded-lg disabled:bg-gray-200 disabled:cursor-wait"
          placeholder="Put social media video url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-white bg-indigo-500 rounded-lg disabled:bg-gray-200 disabled:cursor-wait"
        >
          {loading ? "Downloading..." : "Download"}
        </button>
      </form>
    </main>
  );
};

export default App;
