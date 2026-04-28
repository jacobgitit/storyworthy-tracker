import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

const todayISO = () => new Date().toISOString().slice(0, 10);
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const prompts = [
  "First time I realized I was wrong",
  "First time I felt like the outsider",
  "First time I surprised myself",
  "Last time I almost quit",
  "Last time I apologized and meant it",
  "Last time I acted braver than I felt",
  "Best lesson I learned the hard way",
  "Best compliment that secretly mattered",
  "Best failure that changed my path",
  "Worst advice I ever followed",
  "Worst moment that later became useful",
  "Worst version of me that still teaches me",
];

const scoreItems = [
  ["change", "Change over time"],
  ["fiveSecond", "Five-second moment"],
  ["stakes", "Stakes"],
  ["butTherefore", "But and therefore"],
  ["cinema", "Cinema of the mind"],
  ["ending", "Ending"],
  ["dinner", "Dinner Test"],
  ["vulnerability", "Vulnerability"],
  ["brevity", "Brevity"],
  ["delivery", "Delivery readiness"],
];

function blankRatings() {
  return scoreItems.reduce((acc, item) => {
    acc[item[0]] = 0;
    return acc;
  }, {});
}

function newMoment() {
  return {
    id: makeId(),
    date: todayISO(),
    title: "",
    moment: "",
    fiveSecond: "",
    change: "",
    place: "",
    tags: "",
    potential: 3,
  };
}

function newStory(seed) {
  return {
    id: makeId(),
    title: seed?.title || "Untitled story",
    sourceMomentId: seed?.id || "",
    before: "",
    after: "",
    fiveSecond: seed?.fiveSecond || "",
    beginning: "",
    middle: "",
    ending: "",
    elephant: "",
    backpack: "",
    breadcrumbs: "",
    hourglass: "",
    crystalBall: "",
    humor: "",
    cinema: seed?.place || "",
    butTherefore: "",
    dinnerTest: "",
    draft: "",
    presentTense: false,
    ownStory: true,
    ratings: blankRatings(),
  };
}

function newPractice(storyId = "") {
  return {
    id: makeId(),
    storyId,
    date: todayISO(),
    audience: "",
    minutes: 5,
    reps: 1,
    rating: 3,
    notes: "",
  };
}

function useLocalStorage(key, fallback) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return fallback;
    try {
      const saved = window.localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage failed. The app still works for this session.
    }
  }, [key, value]);

  return [value, setValue];
}

function shortDate(date) {
  if (!date) return "";
  try {
    return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return date;
  }
}

function calcStreak(moments) {
  const dates = new Set(moments.map((m) => m.date));
  let count = 0;
  const cursor = new Date(`${todayISO()}T12:00:00`);
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function ratingScore(story) {
  if (!story?.ratings) return 0;
  const total = scoreItems.reduce((sum, item) => sum + Number(story.ratings[item[0]] || 0), 0);
  return Math.round((total / (scoreItems.length * 5)) * 100);
}

function autoScore(story) {
  if (!story) return 0;
  const stakes = [story.elephant, story.backpack, story.breadcrumbs, story.hourglass, story.crystalBall, story.humor].filter(Boolean).length;
  const checks = [
    Boolean(story.before && story.after),
    Boolean(story.fiveSecond),
    Boolean(story.beginning),
    Boolean(story.ending),
    stakes >= 2,
    /\bbut\b|\btherefore\b/i.test(story.butTherefore || ""),
    Boolean(story.cinema),
    Boolean(story.dinnerTest),
    Boolean(story.presentTense),
    Boolean(story.ownStory),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function downloadJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `storyworthy-tracker-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Card({ children, className = "" }) {
  return <div className={cx("rounded-3xl border border-slate-200 bg-white p-5 shadow-sm", className)}>{children}</div>;
}

function Button({ children, onClick, type = "button", variant = "dark", disabled = false, className = "" }) {
  const styles = {
    dark: "bg-slate-950 text-white hover:bg-slate-800",
    light: "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
    danger: "bg-rose-50 text-rose-700 hover:bg-rose-100",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx("rounded-2xl px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50", styles[variant], className)}
    >
      {children}
    </button>
  );
}

function Field({ label, value, onChange, placeholder = "", type = "text" }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-slate-200"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder = "", rows = 4 }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:ring-4 focus:ring-slate-200"
      />
    </label>
  );
}

function Stat({ label, value, detail }) {
  return (
    <Card className="p-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </Card>
  );
}

function Rating({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1">
      {[0, 1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cx(
            "h-8 w-8 rounded-full text-xs font-black",
            Number(value) === n ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export default function StoryworthyStorytellingTracker() {
  const [session, setSession] = useState(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState("");

  const [tab, setTab] = useState("dashboard");
  const [moments, setMoments] = useLocalStorage("storyworthy_moments_v4", []);
  const [stories, setStories] = useLocalStorage("storyworthy_stories_v4", []);
  const [practices, setPractices] = useLocalStorage("storyworthy_practices_v4", []);
  const [momentForm, setMomentForm] = useState(newMoment());
  const [promptIndex, setPromptIndex] = useState(0);
  const [freewrite, setFreewrite] = useState("");
  const [seconds, setSeconds] = useState(300);
  const [running, setRunning] = useState(false);
  const [activeStoryId, setActiveStoryId] = useState("");
  const [practiceForm, setPracticeForm] = useState(newPractice(""));

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthLoading(false);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    if (seconds <= 0) {
      setRunning(false);
      return undefined;
    }
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running, seconds]);

  useEffect(() => {
    if (!activeStoryId && stories.length) setActiveStoryId(stories[0].id);
  }, [activeStoryId, stories]);

  const activeStory = stories.find((story) => story.id === activeStoryId) || null;
  const streak = useMemo(() => calcStreak(moments), [moments]);
  const practiceMinutes = practices.reduce((sum, p) => sum + Number(p.minutes || 0), 0);
  const averageScore = stories.length ? Math.round(stories.reduce((sum, s) => sum + ratingScore(s), 0) / stories.length) : 0;
  const timerText = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  async function sendMagicLink(event) {
    event.preventDefault();
    setAuthMessage("");

    if (!authEmail.trim()) {
      setAuthMessage("Enter your email first.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: authEmail.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setAuthMessage(error.message);
    } else {
      setAuthMessage("Magic link sent. Check your email.");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  function saveMoment() {
    const hasText = [momentForm.title, momentForm.moment, momentForm.fiveSecond, momentForm.change].some((x) => String(x || "").trim());
    if (!hasText) return;
    setMoments([{ ...momentForm, id: makeId() }, ...moments]);
    setMomentForm(newMoment());
  }

  function createStory(seed = null) {
    const story = newStory(seed);
    setStories([story, ...stories]);
    setActiveStoryId(story.id);
    setPracticeForm(newPractice(story.id));
    setTab("lab");
  }

  function updateStory(patch) {
    if (!activeStory) return;
    setStories(stories.map((story) => (story.id === activeStory.id ? { ...story, ...patch } : story)));
  }

  function updateRating(key, value) {
    if (!activeStory) return;
    updateStory({ ratings: { ...activeStory.ratings, [key]: value } });
  }

  function deleteStory(id) {
    const nextStories = stories.filter((story) => story.id !== id);
    setStories(nextStories);
    setActiveStoryId(nextStories.length ? nextStories[0].id : "");
  }

  function saveFreewrite() {
    if (!freewrite.trim()) return;
    const seed = newMoment();
    setMoments([{ ...seed, title: "Freewrite seed", moment: freewrite, tags: "freewrite", potential: 2 }, ...moments]);
    setFreewrite("");
  }

  function savePractice() {
    const chosenId = practiceForm.storyId || stories[0]?.id || "";
    if (!chosenId) return;
    setPractices([{ ...practiceForm, id: makeId(), storyId: chosenId }, ...practices]);
    setPracticeForm(newPractice(chosenId));
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 text-slate-900">
        <div className="mx-auto mt-24 max-w-md rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black">Loading...</h1>
          <p className="mt-2 text-sm text-slate-600">Checking your login session.</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 text-slate-900">
        <div className="mx-auto mt-20 max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-600">Storyworthy tracker</p>
          <h1 className="text-3xl font-black tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Enter your email and Supabase will send you a magic link. No password needed.</p>

          <form onSubmit={sendMagicLink} className="mt-6 space-y-4">
            <Field label="Email" type="email" value={authEmail} onChange={setAuthEmail} placeholder="you@example.com" />
            <Button type="submit" className="w-full py-3">Send magic link</Button>
          </form>

          {authMessage && <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">{authMessage}</p>}
        </div>
      </div>
    );
  }

  const tabs = [
    ["dashboard", "Dashboard"],
    ["moments", "Daily moments"],
    ["lab", "Story lab"],
    ["practice", "Practice"],
    ["concepts", "Concept map"],
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 text-slate-900 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-600">Storyworthy tracker</p>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Become a better storyteller, one true moment at a time.</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Capture daily moments, find the five-second turn, build stakes, practice delivery, and track your reps.</p>
              <p className="mt-2 text-xs font-bold text-slate-500">Signed in as {session.user.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="light" onClick={() => downloadJson({ moments, stories, practices, exportedAt: new Date().toISOString() })}>Export JSON</Button>
              <Button variant="light" onClick={signOut}>Sign out</Button>
              <Button onClick={() => setTab("moments")}>Log today</Button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-6 lg:h-fit">
            <nav className="space-y-1">
              {tabs.map((item) => (
                <button
                  key={item[0]}
                  type="button"
                  onClick={() => setTab(item[0])}
                  className={cx("w-full rounded-2xl px-3 py-3 text-left text-sm font-black transition", tab === item[0] ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100")}
                >
                  {item[1]}
                </button>
              ))}
            </nav>
          </aside>

          <main className="space-y-6">
            {tab === "dashboard" && (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Stat label="Moments captured" value={moments.length} detail="Daily entries" />
                  <Stat label="Stories in lab" value={stories.length} detail="Seeds being shaped" />
                  <Stat label="Practice minutes" value={practiceMinutes} detail="Logged telling reps" />
                  <Stat label="Current streak" value={streak} detail="Consecutive days" />
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
                  <Card>
                    <h2 className="mb-4 text-xl font-black">Recent story seeds</h2>
                    <div className="space-y-3">
                      {moments.slice(0, 5).map((m) => (
                        <div key={m.id} className="rounded-2xl bg-slate-50 p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-xs font-black uppercase tracking-wide text-slate-400">{shortDate(m.date)}</p>
                              <h3 className="font-black">{m.title || "Untitled moment"}</h3>
                              <p className="mt-1 text-sm leading-6 text-slate-600">{m.moment}</p>
                            </div>
                            <Button variant="light" onClick={() => createStory(m)}>Shape it</Button>
                          </div>
                        </div>
                      ))}
                      {!moments.length && <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No moments yet. Start with the smallest thing that made today different.</p>}
                    </div>
                  </Card>

                  <Card>
                    <h2 className="text-xl font-black">Next best rep</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {moments.length === 0
                        ? "Log one moment from today. Small counts."
                        : stories.length === 0
                        ? "Convert your strongest moment into a story and identify the five-second turn."
                        : practices.length === 0
                        ? "Practice one story out loud for five minutes without memorizing it."
                        : "Pick the story with the lowest score and repair one weak link."}
                    </p>
                    <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-white">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-300">Prompt</p>
                      <p className="mt-1 text-lg font-black">{prompts[promptIndex]}</p>
                    </div>
                    <p className="mt-4 text-sm font-bold text-slate-500">Average craft score: {averageScore}%</p>
                    <Button className="mt-4" variant="light" onClick={() => setPromptIndex((promptIndex + 1) % prompts.length)}>New prompt</Button>
                  </Card>
                </div>
              </>
            )}

            {tab === "moments" && (
              <>
                <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
                  <Card>
                    <h2 className="text-2xl font-black">Daily moment capture</h2>
                    <p className="mt-1 text-sm text-slate-500">Five minutes. One moment. A few sentences.</p>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <Field label="Date" type="date" value={momentForm.date} onChange={(v) => setMomentForm({ ...momentForm, date: v })} />
                      <Field label="Moment title" value={momentForm.title} onChange={(v) => setMomentForm({ ...momentForm, title: v })} placeholder="The elevator apology" />
                    </div>
                    <div className="mt-4 grid gap-4">
                      <TextArea label="What made today different?" value={momentForm.moment} onChange={(v) => setMomentForm({ ...momentForm, moment: v })} placeholder="Write the smallest moment you might otherwise forget." />
                      <TextArea label="Possible five-second moment" value={momentForm.fiveSecond} onChange={(v) => setMomentForm({ ...momentForm, fiveSecond: v })} placeholder="The exact moment when something changed." rows={3} />
                      <TextArea label="How did you change, even slightly?" value={momentForm.change} onChange={(v) => setMomentForm({ ...momentForm, change: v })} placeholder="Before this moment I believed... after this moment I saw..." rows={3} />
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <Field label="Place" value={momentForm.place} onChange={(v) => setMomentForm({ ...momentForm, place: v })} placeholder="Where are we in the movie?" />
                      <Field label="Tags" value={momentForm.tags} onChange={(v) => setMomentForm({ ...momentForm, tags: v })} placeholder="work, leadership, family" />
                    </div>
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                      <div className="mb-2 flex items-center justify-between text-sm font-black"><span>Story potential</span><span>{momentForm.potential}/5</span></div>
                      <input type="range" min="1" max="5" value={momentForm.potential} onChange={(e) => setMomentForm({ ...momentForm, potential: Number(e.target.value) })} className="w-full" />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button onClick={saveMoment}>Save moment</Button>
                      <Button variant="light" onClick={() => setMomentForm(newMoment())}>Clear</Button>
                    </div>
                  </Card>

                  <div className="space-y-6">
                    <Card>
                      <h3 className="text-xl font-black">First, Last, Best, Worst</h3>
                      <div className="my-4 rounded-2xl bg-slate-950 p-5 text-lg font-black text-white">{prompts[promptIndex]}</div>
                      <Button variant="light" onClick={() => setPromptIndex((promptIndex + 1) % prompts.length)}>Another prompt</Button>
                    </Card>

                    <Card>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-black">Pen sprint</h3>
                          <p className="text-sm text-slate-500">Do not judge. Keep the pen moving.</p>
                        </div>
                        <div className="rounded-2xl bg-slate-100 px-4 py-2 font-mono text-lg font-black">{timerText}</div>
                      </div>
                      <div className="mt-4">
                        <TextArea label="Freewrite" value={freewrite} onChange={setFreewrite} placeholder="Start anywhere." rows={7} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button variant="light" onClick={() => setRunning(!running)}>{running ? "Pause" : "Start"}</Button>
                        <Button variant="light" onClick={() => { setSeconds(300); setRunning(false); }}>Reset</Button>
                        <Button onClick={saveFreewrite}>Save seed</Button>
                      </div>
                    </Card>
                  </div>
                </div>

                <Card>
                  <h2 className="mb-4 text-xl font-black">Moment bank</h2>
                  <div className="grid gap-3">
                    {moments.map((m) => (
                      <div key={m.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="mb-2 flex flex-wrap gap-2">
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">{shortDate(m.date)}</span>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">Potential {m.potential}/5</span>
                              {m.tags && <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">{m.tags}</span>}
                            </div>
                            <h3 className="text-lg font-black">{m.title || "Untitled moment"}</h3>
                            <p className="mt-1 text-sm leading-6 text-slate-600">{m.moment}</p>
                            {m.fiveSecond && <p className="mt-2 text-sm font-bold text-slate-800">Turn: {m.fiveSecond}</p>}
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <Button variant="light" onClick={() => createStory(m)}>Shape</Button>
                            <Button variant="danger" onClick={() => setMoments(moments.filter((item) => item.id !== m.id))}>Delete</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!moments.length && <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Your bank is empty. The next ordinary moment is eligible.</p>}
                  </div>
                </Card>
              </>
            )}

            {tab === "lab" && (
              <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
                <Card className="h-fit">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <h2 className="text-xl font-black">Story lab</h2>
                    <Button onClick={() => createStory(null)}>New</Button>
                  </div>
                  <div className="space-y-2">
                    {stories.map((story) => (
                      <button key={story.id} type="button" onClick={() => setActiveStoryId(story.id)} className={cx("w-full rounded-2xl border p-3 text-left transition", activeStoryId === story.id ? "border-slate-950 bg-slate-950 text-white" : "border-slate-100 bg-slate-50 hover:bg-slate-100")}>
                        <p className="font-black">{story.title || "Untitled story"}</p>
                        <p className={cx("mt-1 text-xs", activeStoryId === story.id ? "text-slate-200" : "text-slate-500")}>Auto {autoScore(story)}% · Self {ratingScore(story)}%</p>
                      </button>
                    ))}
                    {!stories.length && <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No stories yet. Convert a moment or create a blank story.</p>}
                  </div>
                </Card>

                {!activeStory ? (
                  <Card>
                    <h2 className="text-2xl font-black">No active story</h2>
                    <p className="mt-2 text-slate-500">Create a story from a daily moment to start shaping it.</p>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    <Card>
                      <div className="grid gap-4 lg:grid-cols-[1fr_230px]">
                        <div>
                          <Field label="Story title" value={activeStory.title} onChange={(v) => updateStory({ title: v })} />
                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <TextArea label="Before" value={activeStory.before} onChange={(v) => updateStory({ before: v })} placeholder="At the start, I was..." />
                            <TextArea label="After" value={activeStory.after} onChange={(v) => updateStory({ after: v })} placeholder="By the end, I realized..." />
                          </div>
                        </div>
                        <div className="rounded-3xl bg-slate-50 p-4">
                          <p className="text-sm font-black text-slate-600">Auto craft check</p>
                          <p className="mt-1 text-3xl font-black">{autoScore(activeStory)}%</p>
                          <p className="mt-2 text-sm font-bold text-slate-500">Self score: {ratingScore(activeStory)}%</p>
                          <Button className="mt-4 w-full" variant="danger" onClick={() => deleteStory(activeStory.id)}>Delete story</Button>
                        </div>
                      </div>
                    </Card>

                    <Card>
                      <h3 className="mb-4 text-xl font-black">Core story structure</h3>
                      <div className="grid gap-4">
                        <TextArea label="Five-second moment" value={activeStory.fiveSecond} onChange={(v) => updateStory({ fiveSecond: v })} placeholder="The tiny turn where the change happens." rows={3} />
                        <TextArea label="Beginning" value={activeStory.beginning} onChange={(v) => updateStory({ beginning: v })} placeholder="Start close to movement." rows={3} />
                        <TextArea label="Middle beats" value={activeStory.middle} onChange={(v) => updateStory({ middle: v })} placeholder="Key beats only." rows={4} />
                        <TextArea label="Ending" value={activeStory.ending} onChange={(v) => updateStory({ ending: v })} placeholder="Land the meaning, but leave a frayed edge." rows={3} />
                        <TextArea label="But and therefore chain" value={activeStory.butTherefore} onChange={(v) => updateStory({ butTherefore: v })} placeholder="This happened, but... therefore..." rows={3} />
                      </div>
                    </Card>

                    <Card>
                      <h3 className="mb-4 text-xl font-black">Stakes builders</h3>
                      <div className="grid gap-4 lg:grid-cols-2">
                        <TextArea label="Elephant" value={activeStory.elephant} onChange={(v) => updateStory({ elephant: v })} placeholder="Name the obvious worry or tension." rows={3} />
                        <TextArea label="Backpack" value={activeStory.backpack} onChange={(v) => updateStory({ backpack: v })} placeholder="What weight, history, or hope are you carrying?" rows={3} />
                        <TextArea label="Breadcrumbs" value={activeStory.breadcrumbs} onChange={(v) => updateStory({ breadcrumbs: v })} placeholder="What clues make the audience lean forward?" rows={3} />
                        <TextArea label="Hourglass" value={activeStory.hourglass} onChange={(v) => updateStory({ hourglass: v })} placeholder="What clock is ticking?" rows={3} />
                        <TextArea label="Crystal ball" value={activeStory.crystalBall} onChange={(v) => updateStory({ crystalBall: v })} placeholder="What possible future can the listener imagine?" rows={3} />
                        <TextArea label="Humor" value={activeStory.humor} onChange={(v) => updateStory({ humor: v })} placeholder="Where can a laugh release pressure?" rows={3} />
                      </div>
                    </Card>

                    <Card>
                      <h3 className="mb-4 text-xl font-black">Scene and delivery fit</h3>
                      <div className="grid gap-4 lg:grid-cols-2">
                        <TextArea label="Cinema of the mind" value={activeStory.cinema} onChange={(v) => updateStory({ cinema: v })} placeholder="Where are we? What should the audience see?" />
                        <TextArea label="Dinner Test notes" value={activeStory.dinnerTest} onChange={(v) => updateStory({ dinnerTest: v })} placeholder="Would this sound natural at dinner with a friend?" />
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-700"><input type="checkbox" checked={activeStory.presentTense} onChange={(e) => updateStory({ presentTense: e.target.checked })} />Present tense is the main engine</label>
                        <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-700"><input type="checkbox" checked={activeStory.ownStory} onChange={(e) => updateStory({ ownStory: e.target.checked })} />I am the protagonist</label>
                      </div>
                    </Card>

                    <Card>
                      <h3 className="mb-4 text-xl font-black">Tellable draft</h3>
                      <TextArea label="Draft" value={activeStory.draft} onChange={(v) => updateStory({ draft: v })} placeholder="Write a tellable version." rows={10} />
                    </Card>

                    <Card>
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-xl font-black">Self-score card</h3>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black">{ratingScore(activeStory)}%</span>
                      </div>
                      <div className="grid gap-3">
                        {scoreItems.map((item) => (
                          <div key={item[0]} className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_auto] md:items-center">
                            <p className="font-black">{item[1]}</p>
                            <Rating value={activeStory.ratings[item[0]] || 0} onChange={(value) => updateRating(item[0], value)} />
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {tab === "practice" && (
              <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
                <Card>
                  <h2 className="text-2xl font-black">Tell it out loud</h2>
                  <div className="mt-5 grid gap-4">
                    <label className="block">
                      <span className="mb-1 block text-sm font-bold text-slate-700">Story</span>
                      <select value={practiceForm.storyId} onChange={(e) => setPracticeForm({ ...practiceForm, storyId: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-slate-200">
                        <option value="">Select a story</option>
                        {stories.map((story) => <option key={story.id} value={story.id}>{story.title}</option>)}
                      </select>
                    </label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Date" type="date" value={practiceForm.date} onChange={(v) => setPracticeForm({ ...practiceForm, date: v })} />
                      <Field label="Audience" value={practiceForm.audience} onChange={(v) => setPracticeForm({ ...practiceForm, audience: v })} placeholder="Mirror, friend, room, meeting" />
                      <Field label="Minutes" type="number" value={practiceForm.minutes} onChange={(v) => setPracticeForm({ ...practiceForm, minutes: v })} />
                      <Field label="Reps" type="number" value={practiceForm.reps} onChange={(v) => setPracticeForm({ ...practiceForm, reps: v })} />
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="mb-2 flex items-center justify-between text-sm font-black"><span>Session rating</span><span>{practiceForm.rating}/5</span></div>
                      <input type="range" min="1" max="5" value={practiceForm.rating} onChange={(e) => setPracticeForm({ ...practiceForm, rating: Number(e.target.value) })} className="w-full" />
                    </div>
                    <TextArea label="Notes" value={practiceForm.notes} onChange={(v) => setPracticeForm({ ...practiceForm, notes: v })} placeholder="Where did it drag? What landed? What gets cut?" rows={4} />
                    <Button onClick={savePractice} disabled={!stories.length}>Log practice</Button>
                  </div>
                </Card>

                <Card>
                  <h2 className="mb-4 text-2xl font-black">Practice history</h2>
                  <div className="space-y-3">
                    {practices.map((practice) => {
                      const story = stories.find((s) => s.id === practice.storyId);
                      return (
                        <div key={practice.id} className="rounded-2xl bg-slate-50 p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-xs font-black uppercase tracking-wide text-slate-400">{shortDate(practice.date)}</p>
                              <h3 className="font-black">{story ? story.title : "Story practice"}</h3>
                              <p className="text-sm text-slate-600">{practice.minutes} min · {practice.reps} reps · Rating {practice.rating}/5</p>
                              {practice.notes && <p className="mt-2 text-sm leading-6 text-slate-600">{practice.notes}</p>}
                            </div>
                            <Button variant="danger" onClick={() => setPractices(practices.filter((p) => p.id !== practice.id))}>Delete</Button>
                          </div>
                        </div>
                      );
                    })}
                    {!practices.length && <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No practice logged yet. One five-minute rep counts.</p>}
                  </div>
                </Card>
              </div>
            )}

            {tab === "concepts" && (
              <>
                <Card>
                  <h2 className="text-2xl font-black">Concept map</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">This app follows three movements: find your moments, craft them into change-driven stories, then practice telling them like a real person.</p>
                </Card>
                <div className="grid gap-6 lg:grid-cols-3">
                  <Card><h3 className="text-xl font-black">Find stories</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600"><li>Capture one storyworthy moment every day.</li><li>Ask what made today different.</li><li>Use First, Last, Best, Worst prompts.</li><li>Freewrite without judging the first idea.</li></ul></Card>
                  <Card><h3 className="text-xl font-black">Craft stories</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600"><li>A story must show change over time.</li><li>Find the five-second moment.</li><li>Use stakes so the listener leans forward.</li><li>Use but and therefore instead of and then.</li></ul></Card>
                  <Card><h3 className="text-xl font-black">Tell stories</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600"><li>Use present tense for immediacy.</li><li>Do not memorize. Know your beats.</li><li>Keep the audience inside the scene.</li><li>Let the ending breathe.</li></ul></Card>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
