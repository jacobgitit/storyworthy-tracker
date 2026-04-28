import React, { useEffect, useMemo, useState } from "react";

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
  ["change", "Change over time", "The listener can tell who you were before and after."],
  ["fiveSecond", "Five-second moment", "The story turns on one clear, tiny moment."],
  ["stakes", "Stakes", "The listener knows what could be lost, gained, feared, or hoped for."],
  ["butTherefore", "But and therefore", "The story moves through consequence, not a chain of and then."],
  ["cinema", "Cinema of the mind", "The audience can see where they are and what is happening."],
  ["ending", "Frayed ending", "The ending lands on meaning without over-explaining it."],
  ["dinner", "Dinner Test", "It sounds like a crafted version of how you would tell a friend."],
  ["vulnerability", "Vulnerability", "You reveal something honest, human, or less-than-perfect."],
  ["brevity", "Brevity", "The story is trimmed to what serves the change."],
  ["delivery", "Delivery readiness", "You can tell it without memorizing it word for word."],
];

const deliveryChecks = [
  ["notMemorized", "Told, not memorized"],
  ["eyeContact", "Eye contact"],
  ["emotion", "Emotion controlled"],
  ["present", "Present tense"],
  ["noProps", "No props"],
  ["cleanEnding", "Ending landed"],
];

function newMoment() {
  return {
    id: makeId(),
    date: todayISO(),
    title: "",
    moment: "",
    fiveSecond: "",
    change: "",
    people: "",
    place: "",
    emotion: "",
    tags: "",
    potential: 3,
  };
}

function blankRatings() {
  return scoreItems.reduce((acc, item) => {
    acc[item[0]] = 0;
    return acc;
  }, {});
}

function newStory(seed) {
  return {
    id: makeId(),
    sourceMomentId: seed ? seed.id : "",
    title: seed && seed.title ? seed.title : "Untitled story",
    purpose: "",
    before: "",
    after: "",
    fiveSecond: seed ? seed.fiveSecond : "",
    beginning: "",
    middle: "",
    ending: "",
    elephant: "",
    backpack: "",
    breadcrumbs: "",
    hourglass: "",
    crystalBall: "",
    humor: "",
    cinema: seed ? seed.place : "",
    bigToLittle: "",
    butTherefore: "",
    dinnerTest: "",
    edits: "",
    presentTense: false,
    ownStory: true,
    draft: "",
    ratings: blankRatings(),
  };
}

function newPractice(storyId) {
  return {
    id: makeId(),
    storyId: storyId || "",
    date: todayISO(),
    audience: "",
    minutes: 5,
    reps: 1,
    rating: 3,
    notes: "",
    checks: deliveryChecks.reduce((acc, item) => {
      acc[item[0]] = false;
      return acc;
    }, {}),
  };
}

function useLocalStorage(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const saved = window.localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch (error) {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Keep the app usable even when storage is unavailable.
    }
  }, [key, value]);

  return [value, setValue];
}

function cx() {
  return Array.from(arguments).filter(Boolean).join(" ");
}

function shortDate(date) {
  if (!date) return "";
  try {
    return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch (error) {
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
  if (!story || !story.ratings) return 0;
  const values = scoreItems.map((item) => Number(story.ratings[item[0]] || 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round((total / (values.length * 5)) * 100);
}

function craftChecks(story) {
  if (!story) return [];
  const stakesCount = [story.elephant, story.backpack, story.breadcrumbs, story.hourglass, story.crystalBall, story.humor].filter(Boolean).length;
  return [
    ["Change", Boolean(story.before && story.after)],
    ["Five-second moment", Boolean(story.fiveSecond)],
    ["Beginning", Boolean(story.beginning)],
    ["Ending", Boolean(story.ending)],
    ["Stakes", stakesCount >= 2],
    ["But/Therefore", /but|therefore/i.test(story.butTherefore || "")],
    ["Cinema", Boolean(story.cinema)],
    ["Dinner Test", Boolean(story.dinnerTest)],
    ["Present tense", Boolean(story.presentTense)],
    ["Your story", Boolean(story.ownStory)],
  ];
}

function autoScore(story) {
  const checks = craftChecks(story);
  if (!checks.length) return 0;
  const passed = checks.filter((item) => item[1]).length;
  return Math.round((passed / checks.length) * 100);
}

function last14Days(moments, practices) {
  const rows = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(`${todayISO()}T12:00:00`);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    rows.push({
      iso,
      label: shortDate(iso),
      moments: moments.filter((m) => m.date === iso).length,
      minutes: practices.filter((p) => p.date === iso).reduce((sum, p) => sum + Number(p.minutes || 0), 0),
    });
  }
  return rows;
}

function downloadJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `storytelling-tracker-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function Card(props) {
  return <div className={cx("rounded-3xl border border-slate-200 bg-white p-5 shadow-sm", props.className)}>{props.children}</div>;
}

function Button(props) {
  const variant = props.variant || "dark";
  const styles = {
    dark: "bg-slate-950 text-white hover:bg-slate-800",
    light: "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
    ghost: "text-slate-700 hover:bg-slate-100",
    danger: "bg-rose-50 text-rose-700 hover:bg-rose-100",
  };
  return (
    <button
      type={props.type || "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      className={cx("rounded-2xl px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50", styles[variant], props.className)}
    >
      {props.children}
    </button>
  );
}

function Field(props) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-700">{props.label}</span>
      <input
        type={props.type || "text"}
        value={props.value}
        onChange={(e) => props.onChange(props.type === "number" ? Number(e.target.value) : e.target.value)}
        placeholder={props.placeholder || ""}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-slate-200"
      />
    </label>
  );
}

function TextArea(props) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-700">{props.label}</span>
      <textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        rows={props.rows || 4}
        placeholder={props.placeholder || ""}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:ring-4 focus:ring-slate-200"
      />
    </label>
  );
}

function Stat(props) {
  return (
    <Card className="p-4">
      <p className="text-sm font-semibold text-slate-500">{props.label}</p>
      <p className="mt-1 text-3xl font-black text-slate-950">{props.value}</p>
      <p className="mt-1 text-xs text-slate-500">{props.detail}</p>
    </Card>
  );
}

function MiniBars(props) {
  const max = Math.max(1, ...props.data.map((row) => Number(row[props.valueKey] || 0)));
  return (
    <div className="flex h-44 items-end gap-2 rounded-3xl bg-slate-50 p-4">
      {props.data.map((row) => {
        const value = Number(row[props.valueKey] || 0);
        const height = Math.max(4, Math.round((value / max) * 132));
        return (
          <div key={row.iso} className="flex flex-1 flex-col items-center gap-2">
            <div title={`${row.label}: ${value}`} className="w-full rounded-t-xl bg-slate-950" style={{ height }} />
            <span className="text-[10px] text-slate-500">{row.label.split(" ")[1]}</span>
          </div>
        );
      })}
    </div>
  );
}

function Rating(props) {
  return (
    <div className="flex flex-wrap gap-1">
      {[0, 1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => props.onChange(n)}
          className={cx(
            "h-8 w-8 rounded-full text-xs font-black",
            Number(props.value) === n ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function Progress(props) {
  const value = Math.max(0, Math.min(100, Number(props.value || 0)));
  return (
    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-slate-950" style={{ width: `${value}%` }} />
    </div>
  );
}

export default function StoryworthyStorytellingTracker() {
  const [tab, setTab] = useState("dashboard");
  const [moments, setMoments] = useLocalStorage("storyworthy_moments_v2", []);
  const [stories, setStories] = useLocalStorage("storyworthy_stories_v2", []);
  const [practices, setPractices] = useLocalStorage("storyworthy_practices_v2", []);

  const [momentForm, setMomentForm] = useState(newMoment());
  const [promptIndex, setPromptIndex] = useState(0);
  const [freewrite, setFreewrite] = useState("");
  const [seconds, setSeconds] = useState(300);
  const [running, setRunning] = useState(false);
  const [activeStoryId, setActiveStoryId] = useState("");
  const [practiceForm, setPracticeForm] = useState(newPractice(""));

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      return;
    }
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running, seconds]);

  useEffect(() => {
    if (!activeStoryId && stories.length) setActiveStoryId(stories[0].id);
  }, [activeStoryId, stories]);

  const activeStory = stories.find((story) => story.id === activeStoryId) || null;
  const chartRows = useMemo(() => last14Days(moments, practices), [moments, practices]);
  const streak = useMemo(() => calcStreak(moments), [moments]);
  const practiceMinutes = practices.reduce((sum, p) => sum + Number(p.minutes || 0), 0);
  const averageScore = stories.length ? Math.round(stories.reduce((sum, s) => sum + ratingScore(s), 0) / stories.length) : 0;

  function saveMoment() {
    const hasText = [momentForm.title, momentForm.moment, momentForm.fiveSecond, momentForm.change].some((x) => String(x || "").trim());
    if (!hasText) return;
    setMoments([{ ...momentForm, id: makeId() }, ...moments]);
    setMomentForm(newMoment());
  }

  function createStory(seed) {
    const story = newStory(seed || null);
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
    if (activeStoryId === id) setActiveStoryId(nextStories.length ? nextStories[0].id : "");
  }

  function saveFreewrite() {
    if (!freewrite.trim()) return;
    const seed = newMoment();
    setMoments([{ ...seed, title: "Freewrite seed", moment: freewrite, tags: "freewrite", potential: 2 }, ...moments]);
    setFreewrite("");
  }

  function savePractice() {
    const chosenId = practiceForm.storyId || (stories[0] && stories[0].id) || "";
    if (!chosenId) return;
    setPractices([{ ...practiceForm, id: makeId(), storyId: chosenId }, ...practices]);
    setPracticeForm(newPractice(chosenId));
  }

  const timerText = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const tabs = [
    ["dashboard", "🏆 Dashboard"],
    ["moments", "📅 Daily moments"],
    ["lab", "🛠️ Story lab"],
    ["practice", "🎙️ Practice"],
    ["concepts", "🧭 Concept map"],
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
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="light" onClick={() => downloadJson({ moments, stories, practices, exportedAt: new Date().toISOString() })}>Export JSON</Button>
              <Button onClick={() => setTab("moments")}>Log today</Button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
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
                  <Stat label="Moments captured" value={moments.length} detail="Homework for Life entries" />
                  <Stat label="Stories in lab" value={stories.length} detail="Seeds being shaped" />
                  <Stat label="Practice minutes" value={practiceMinutes} detail="Logged telling reps" />
                  <Stat label="Current streak" value={streak} detail="Consecutive days through today" />
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <Card>
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-black">Two-week moment rhythm</h2>
                        <p className="text-sm text-slate-500">The main habit is seeing one usable moment per day.</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black">{averageScore}% avg score</span>
                    </div>
                    <MiniBars data={chartRows} valueKey="moments" />
                  </Card>

                  <Card>
                    <h2 className="text-xl font-black">Two-week practice load</h2>
                    <p className="mb-4 text-sm text-slate-500">Theory is the map. Reps are the boots.</p>
                    <MiniBars data={chartRows} valueKey="minutes" />
                  </Card>
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
                        ? "Log one moment from today. Small counts. Small is often where the gold sleeps."
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
                    <p className="mt-1 text-sm text-slate-500">Five minutes. One moment. A few sentences. That is the forge.</p>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <Field label="Date" type="date" value={momentForm.date} onChange={(v) => setMomentForm({ ...momentForm, date: v })} />
                      <Field label="Moment title" value={momentForm.title} onChange={(v) => setMomentForm({ ...momentForm, title: v })} placeholder="The elevator apology" />
                    </div>
                    <div className="mt-4 grid gap-4">
                      <TextArea label="What made today different?" value={momentForm.moment} onChange={(v) => setMomentForm({ ...momentForm, moment: v })} placeholder="Write the smallest moment you might otherwise forget." />
                      <TextArea label="Possible five-second moment" value={momentForm.fiveSecond} onChange={(v) => setMomentForm({ ...momentForm, fiveSecond: v })} placeholder="The exact moment when something changed, clicked, stung, softened, or surprised you." rows={3} />
                      <TextArea label="How did you change, even slightly?" value={momentForm.change} onChange={(v) => setMomentForm({ ...momentForm, change: v })} placeholder="Before this moment I believed... after this moment I saw..." rows={3} />
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <Field label="People" value={momentForm.people} onChange={(v) => setMomentForm({ ...momentForm, people: v })} placeholder="Who was there?" />
                      <Field label="Place" value={momentForm.place} onChange={(v) => setMomentForm({ ...momentForm, place: v })} placeholder="Where are we in the movie?" />
                      <Field label="Emotion" value={momentForm.emotion} onChange={(v) => setMomentForm({ ...momentForm, emotion: v })} placeholder="Embarrassed, proud, grief, awe" />
                      <Field label="Tags" value={momentForm.tags} onChange={(v) => setMomentForm({ ...momentForm, tags: v })} placeholder="work, leadership, divorce, family" />
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
                      <p className="mt-1 text-sm leading-6 text-slate-500">Use this when memory feels padlocked.</p>
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
                        <Button variant="ghost" onClick={() => { setSeconds(300); setRunning(false); }}>Reset</Button>
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
                      <button
                        key={story.id}
                        type="button"
                        onClick={() => setActiveStoryId(story.id)}
                        className={cx("w-full rounded-2xl border p-3 text-left transition", activeStoryId === story.id ? "border-slate-950 bg-slate-950 text-white" : "border-slate-100 bg-slate-50 hover:bg-slate-100")}
                      >
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
                      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                        <div>
                          <Field label="Story title" value={activeStory.title} onChange={(v) => updateStory({ title: v })} />
                          <div className="mt-4">
                            <TextArea label="Purpose" value={activeStory.purpose} onChange={(v) => updateStory({ purpose: v })} placeholder="What do you want this story to do for the listener?" rows={3} />
                          </div>
                        </div>
                        <div className="rounded-3xl bg-slate-50 p-4">
                          <div className="mb-3 flex items-center justify-between"><span className="text-sm font-black text-slate-600">Auto check</span><span className="text-2xl font-black">{autoScore(activeStory)}%</span></div>
                          <Progress value={autoScore(activeStory)} />
                          <div className="mt-4 flex flex-wrap gap-2">
                            {craftChecks(activeStory).map((item) => (
                              <span key={item[0]} className={cx("rounded-full px-2 py-1 text-xs font-black", item[1] ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-500")}>{item[0]}</span>
                            ))}
                          </div>
                          <Button className="mt-4 w-full" variant="danger" onClick={() => deleteStory(activeStory.id)}>Delete story</Button>
                        </div>
                      </div>
                    </Card>

                    <Card>
                      <h3 className="mb-4 text-xl font-black">The real story underneath the events</h3>
                      <div className="grid gap-4 lg:grid-cols-2">
                        <TextArea label="Before" value={activeStory.before} onChange={(v) => updateStory({ before: v })} placeholder="At the start, I was the kind of person who..." />
                        <TextArea label="After" value={activeStory.after} onChange={(v) => updateStory({ after: v })} placeholder="By the end, I had become or realized..." />
                        <TextArea label="Five-second moment" value={activeStory.fiveSecond} onChange={(v) => updateStory({ fiveSecond: v })} placeholder="The tiny turn where the change happens." />
                        <TextArea label="Make the big story little" value={activeStory.bigToLittle} onChange={(v) => updateStory({ bigToLittle: v })} placeholder="Ground the big idea inside a small scene, object, sentence, or gesture." />
                      </div>
                    </Card>

                    <Card>
                      <h3 className="mb-4 text-xl font-black">Shape the arc</h3>
                      <div className="grid gap-4">
                        <TextArea label="Beginning" value={activeStory.beginning} onChange={(v) => updateStory({ beginning: v })} placeholder="Start close to movement." rows={3} />
                        <TextArea label="Middle beats" value={activeStory.middle} onChange={(v) => updateStory({ middle: v })} placeholder="Key beats only. Cut what does not serve change or stakes." rows={4} />
                        <TextArea label="Ending" value={activeStory.ending} onChange={(v) => updateStory({ ending: v })} placeholder="Land the meaning, but leave a frayed edge." rows={3} />
                        <TextArea label="But and therefore chain" value={activeStory.butTherefore} onChange={(v) => updateStory({ butTherefore: v })} placeholder="This happened, but... therefore... but... therefore..." rows={4} />
                      </div>
                    </Card>

                    <Card>
                      <h3 className="mb-4 text-xl font-black">Stakes builders</h3>
                      <div className="grid gap-4 lg:grid-cols-2">
                        <TextArea label="Elephant" value={activeStory.elephant} onChange={(v) => updateStory({ elephant: v })} placeholder="Name the obvious worry, tension, or thing in the room." rows={3} />
                        <TextArea label="Backpack" value={activeStory.backpack} onChange={(v) => updateStory({ backpack: v })} placeholder="What weight, history, need, or hope are you carrying?" rows={3} />
                        <TextArea label="Breadcrumbs" value={activeStory.breadcrumbs} onChange={(v) => updateStory({ breadcrumbs: v })} placeholder="What clues make the audience lean forward?" rows={3} />
                        <TextArea label="Hourglass" value={activeStory.hourglass} onChange={(v) => updateStory({ hourglass: v })} placeholder="What clock is ticking?" rows={3} />
                        <TextArea label="Crystal ball" value={activeStory.crystalBall} onChange={(v) => updateStory({ crystalBall: v })} placeholder="What possible future can the listener imagine?" rows={3} />
                        <TextArea label="Humor" value={activeStory.humor} onChange={(v) => updateStory({ humor: v })} placeholder="Where can a laugh release pressure or create contrast?" rows={3} />
                      </div>
                    </Card>

                    <Card>
                      <h3 className="mb-4 text-xl font-black">Scene, truth, and delivery fit</h3>
                      <div className="grid gap-4 lg:grid-cols-2">
                        <TextArea label="Cinema of the mind" value={activeStory.cinema} onChange={(v) => updateStory({ cinema: v })} placeholder="Where are we? What should the audience see, hear, or feel?" />
                        <TextArea label="Dinner Test notes" value={activeStory.dinnerTest} onChange={(v) => updateStory({ dinnerTest: v })} placeholder="Would this still sound natural at dinner with a friend?" />
                        <TextArea label="Permissible true-story edits" value={activeStory.edits} onChange={(v) => updateStory({ edits: v })} placeholder="What are you omitting, compressing, assuming, progressing, or conflating while staying truthful?" />
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-700"><input type="checkbox" checked={activeStory.presentTense} onChange={(e) => updateStory({ presentTense: e.target.checked })} />Present tense is the main engine</label>
                        <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-700"><input type="checkbox" checked={activeStory.ownStory} onChange={(e) => updateStory({ ownStory: e.target.checked })} />I am the protagonist of my side of the story</label>
                      </div>
                    </Card>

                    <Card>
                      <h3 className="mb-4 text-xl font-black">Tellable draft</h3>
                      <TextArea label="Draft" value={activeStory.draft} onChange={(v) => updateStory({ draft: v })} placeholder="Write a tellable version. Keep it human. No ornamental fog machine." rows={10} />
                    </Card>

                    <Card>
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-black">Self-score card</h3>
                          <p className="text-sm text-slate-500">Score each skill from 0 to 5.</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black">{ratingScore(activeStory)}%</span>
                      </div>
                      <div className="grid gap-3">
                        {scoreItems.map((item) => (
                          <div key={item[0]} className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_auto] md:items-center">
                            <div>
                              <p className="font-black">{item[1]}</p>
                              <p className="text-sm text-slate-500">{item[2]}</p>
                            </div>
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
                  <p className="mt-1 text-sm text-slate-500">No memorizing. Know the path, then walk it.</p>
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
                    <div className="grid gap-2 md:grid-cols-2">
                      {deliveryChecks.map((item) => (
                        <label key={item[0]} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-black text-slate-700">
                          <input type="checkbox" checked={Boolean(practiceForm.checks[item[0]])} onChange={(e) => setPracticeForm({ ...practiceForm, checks: { ...practiceForm.checks, [item[0]]: e.target.checked } })} />
                          {item[1]}
                        </label>
                      ))}
                    </div>
                    <TextArea label="Notes" value={practiceForm.notes} onChange={(v) => setPracticeForm({ ...practiceForm, notes: v })} placeholder="Where did it drag? Where did they lean in? What will you cut?" rows={4} />
                    <Button onClick={savePractice} disabled={!stories.length}>Log practice</Button>
                  </div>
                </Card>

                <Card>
                  <h2 className="mb-4 text-2xl font-black">Practice history</h2>
                  <div className="space-y-3">
                    {practices.map((practice) => {
                      const story = stories.find((s) => s.id === practice.storyId);
                      const checked = Object.values(practice.checks || {}).filter(Boolean).length;
                      return (
                        <div key={practice.id} className="rounded-2xl bg-slate-50 p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-xs font-black uppercase tracking-wide text-slate-400">{shortDate(practice.date)}</p>
                              <h3 className="font-black">{story ? story.title : "Story practice"}</h3>
                              <p className="text-sm text-slate-600">{practice.minutes} min · {practice.reps} reps · Rating {practice.rating}/5 · {checked}/6 delivery checks</p>
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
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">This app follows three movements: find your moments, craft them into change-driven stories, then practice telling them like a real person instead of a memorized statue with shoes.</p>
                </Card>
                <div className="grid gap-6 lg:grid-cols-3">
                  <Card>
                    <h3 className="text-xl font-black">🔎 Find stories</h3>
                    <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                      <li>Capture one storyworthy moment every day.</li>
                      <li>Ask what made today different from every other day.</li>
                      <li>Use First, Last, Best, Worst prompts when memory stalls.</li>
                      <li>Freewrite without judging the first idea.</li>
                    </ul>
                  </Card>
                  <Card>
                    <h3 className="text-xl font-black">🛠️ Craft stories</h3>
                    <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                      <li>A story must show change over time.</li>
                      <li>Find the five-second moment and build around it.</li>
                      <li>Use stakes so the listener leans forward.</li>
                      <li>Use but and therefore instead of and then.</li>
                      <li>Make big stories little through a concrete scene.</li>
                    </ul>
                  </Card>
                  <Card>
                    <h3 className="text-xl font-black">🎙️ Tell stories</h3>
                    <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                      <li>Use present tense for immediacy.</li>
                      <li>Do not memorize. Know your beats.</li>
                      <li>Keep the audience inside the scene.</li>
                      <li>Let the ending breathe.</li>
                    </ul>
                  </Card>
                </div>
                <Card>
                  <h3 className="text-xl font-black">Operating rhythm</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4"><p className="font-black">Daily</p><p className="mt-1 text-sm text-slate-600">Log one moment. No drama requirement.</p></div>
                    <div className="rounded-2xl bg-slate-50 p-4"><p className="font-black">Weekly</p><p className="mt-1 text-sm text-slate-600">Choose one seed and craft the before, after, turn, stakes, and ending.</p></div>
                    <div className="rounded-2xl bg-slate-50 p-4"><p className="font-black">Twice weekly</p><p className="mt-1 text-sm text-slate-600">Tell one story out loud. Score it. Trim one thing.</p></div>
                  </div>
                </Card>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
