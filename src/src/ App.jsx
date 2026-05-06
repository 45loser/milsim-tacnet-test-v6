import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Battery,
  Bot,
  Crosshair,
  MapPin,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Send,
  Shield,
  Users,
  Wifi,
  Zap
} from "lucide-react";

const initialOperators = [
  { id: "G1-1", name: "Dead Eye", role: "Squad Lead", team: "Ghost", x: 18, y: 28, health: 96, ammo: 78, battery: 88, task: "Command and overwatch" },
  { id: "G1-2", name: "Rook", role: "Rifleman", team: "Ghost", x: 26, y: 39, health: 91, ammo: 66, battery: 74, task: "Move to CP Raven" },
  { id: "G1-3", name: "Patch", role: "Medic", team: "Ghost", x: 22, y: 61, health: 100, ammo: 54, battery: 92, task: "Aid station support" },
  { id: "G1-4", name: "Sparrow", role: "Scout", team: "Ghost", x: 51, y: 30, health: 82, ammo: 43, battery: 61, task: "Recon Echo" },
  { id: "H2-1", name: "Anvil", role: "Support", team: "Hammer", x: 71, y: 74, health: 89, ammo: 88, battery: 69, task: "South lane security" },
  { id: "H2-2", name: "Bobby", role: "Comms", team: "Hammer", x: 62, y: 67, health: 94, ammo: 71, battery: 97, task: "Radio relay" },
  { id: "R3-1", name: "Kite", role: "Recon", team: "Raven", x: 76, y: 24, health: 87, ammo: 52, battery: 83, task: "Observe ridge" },
  { id: "R3-2", name: "Mantis", role: "Marksman", team: "Raven", x: 68, y: 35, health: 93, ammo: 59, battery: 79, task: "Screen north route" }
];

const objectives = [
  { label: "CP Raven", x: 34, y: 42 },
  { label: "Echo", x: 66, y: 28 },
  { label: "Aid", x: 20, y: 66 },
  { label: "South Lane", x: 74, y: 78 },
  { label: "Relay", x: 58, y: 55 }
];

const eventPool = [
  "Status green. Continuing movement.",
  "Holding at waypoint. Awaiting update.",
  "Visual on marker. Logging position.",
  "Battery check complete. Radio clear.",
  "Sim contact marker appeared. Maintaining safe training posture.",
  "Repositioning to improve observation angle.",
  "Objective area scanned. No safety issues reported.",
  "Team lead requests full status check.",
  "Comms relay stable. Net traffic normal."
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function nowTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function getStatus(operator) {
  if (operator.health < 65 || operator.ammo < 35) {
    return "Needs Check";
  }

  if (operator.alert) {
    return "Contact Sim";
  }

  if (operator.moving) {
    return "Moving";
  }

  return "Ready";
}

function getBadgeClass(status) {
  if (status === "Ready") {
    return "badge green";
  }

  if (status === "Contact Sim") {
    return "badge amber";
  }

  if (status === "Needs Check") {
    return "badge red";
  }

  return "badge";
}

function getTeamClass(team) {
  if (team === "Ghost") {
    return "unit-dot ghost";
  }

  if (team === "Hammer") {
    return "unit-dot hammer";
  }

  return "unit-dot raven";
}

function getBarClass(value) {
  if (value >= 80) {
    return "fill green";
  }

  if (value >= 55) {
    return "fill amber";
  }

  return "fill red";
}

function StatCard({ label, value, icon }) {
  return (
    <div className="card">
      <div className="stat-title">
        <span>{label}</span>
        {icon}
      </div>
      <div className="stat-number">{value}</div>
    </div>
  );
}

function Meter({ label, value, icon }) {
  return (
    <div className="meter">
      <div className="meter-row">
        <span>{icon} {label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="bar">
        <div
          className={getBarClass(value)}
          style={{ width: clamp(value, 0, 100) + "%" }}
        />
      </div>
    </div>
  );
}

export default function App() {
  const [operators, setOperators] = useState(
    initialOperators.map((operator) => ({
      ...operator,
      moving: true,
      alert: false
    }))
  );

  const [selectedId, setSelectedId] = useState("G1-1");
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1200);
  const [filter, setFilter] = useState("All");
  const [question, setQuestion] = useState("");

  const [logs, setLogs] = useState([
    {
      time: nowTime(),
      from: "TACNET",
      msg: "Live demonstration started. Simulation-only dashboard online."
    },
    {
      time: nowTime(),
      from: "G1-1",
      msg: "All elements report status every cycle."
    }
  ]);

  useEffect(() => {
    if (!running) {
      return;
    }

    const timer = setInterval(() => {
      setOperators((previousOperators) =>
        previousOperators.map((operator) => {
          const nearObjective = objectives.some((objective) => {
            const distance = Math.hypot(
              operator.x - objective.x,
              operator.y - objective.y
            );

            return distance < 10;
          });

          const alert = Math.random() < (nearObjective ? 0.12 : 0.04);

          return {
            ...operator,
            x: clamp(operator.x + randomBetween(-2.8, 2.8), 5, 95),
            y: clamp(operator.y + randomBetween(-2.4, 2.4), 8, 92),
            health: clamp(operator.health - randomBetween(0, alert ? 1.8 : 0.35), 45, 100),
            ammo: clamp(operator.ammo - randomBetween(0, alert ? 2.5 : 0.6), 15, 100),
            battery: clamp(operator.battery - randomBetween(0.05, 0.45), 20, 100),
            moving: Math.random() > 0.18,
            alert
          };
        })
      );

      setLogs((previousLogs) => {
        const randomOperator =
          initialOperators[Math.floor(Math.random() * initialOperators.length)];

        const randomEvent =
          eventPool[Math.floor(Math.random() * eventPool.length)];

        return [
          {
            time: nowTime(),
            from: randomOperator.id,
            msg: randomEvent
          },
          ...previousLogs
        ].slice(0, 12);
      });
    }, speed);

    return () => clearInterval(timer);
  }, [running, speed]);

  const selected =
    operators.find((operator) => operator.id === selectedId) || operators[0];

  const filteredOperators = useMemo(() => {
    if (filter === "All") {
      return operators;
    }

    return operators.filter((operator) => operator.team === filter);
  }, [operators, filter]);

  const readyCount = operators.filter(
    (operator) => getStatus(operator) === "Ready"
  ).length;

  const averageHealth = Math.round(
    operators.reduce((total, operator) => total + operator.health, 0) /
      operators.length
  );

  const alertCount = operators.filter((operator) => operator.alert).length;

  function askTacnet() {
    const cleanQuestion = question.trim();

    if (!cleanQuestion) {
      return;
    }

    const input = cleanQuestion.toLowerCase();

    let answer =
      "Try asking: sitrep, Ghost status, Hammer status, Raven status, or selected.";

    if (input.includes("sitrep") || input.includes("status")) {
      answer =
        "SITREP: " +
        readyCount +
        "/" +
        operators.length +
        " ready, " +
        alertCount +
        " simulated alert markers, average health " +
        averageHealth +
        "%. Selected: " +
        selected.id +
        " " +
        selected.name +
        ", " +
        getStatus(selected) +
        ".";
    }

    if (input.includes("ghost")) {
      answer =
        "Ghost team: " +
        operators
          .filter((operator) => operator.team === "Ghost")
          .map((operator) => operator.id + " " + getStatus(operator))
          .join("; ") +
        ".";
    }

    if (input.includes("hammer")) {
      answer =
        "Hammer team: " +
        operators
          .filter((operator) => operator.team === "Hammer")
          .map((operator) => operator.id + " " + getStatus(operator))
          .join("; ") +
        ".";
    }

    if (input.includes("raven")) {
      answer =
        "Raven team: " +
        operators
          .filter((operator) => operator.team === "Raven")
          .map((operator) => operator.id + " " + getStatus(operator))
          .join("; ") +
        ".";
    }

    if (input.includes("selected")) {
      answer =
        selected.id +
        " " +
        selected.name +
        ": " +
        selected.role +
        ", " +
        selected.team +
        ", task: " +
        selected.task +
        ", health " +
        Math.round(selected.health) +
        "%, ammo " +
        Math.round(selected.ammo) +
        "%, battery " +
        Math.round(selected.battery) +
        "%.";
    }

    setLogs((previousLogs) =>
      [
        { time: nowTime(), from: "YOU", msg: cleanQuestion },
        { time: nowTime(), from: "TACNET AI", msg: answer },
        ...previousLogs
      ].slice(0, 12)
    );

    setQuestion("");
  }

  function resetSimulation() {
    setOperators(
      initialOperators.map((operator) => ({
        ...operator,
        moving: true,
        alert: false
      }))
    );

    setSelectedId("G1-1");

    setLogs([
      {
        time: nowTime(),
        from: "TACNET",
        msg: "Simulation reset. All teams restored to initial positions."
      }
    ]);
  }

  return (
    <main className="app">
      <div className="container">
        <header className="header">
          <div>
            <div className="kicker">
              <Shield size={16} />
              Live Tacnet Sim
            </div>
            <h1>Milsim Live Command Dashboard</h1>
            <p className="subtitle">
              Simulation-only command interface with moving teams, automatic
              comms, map markers, team status, and a local assistant panel.
            </p>
          </div>

          <div className="badges">
            <span className="badge green">
              <Wifi size={14} />
              Local Live Sim
            </span>
            <span className="badge amber">
              <AlertTriangle size={14} />
              Training Only
            </span>
          </div>
        </header>

        <section className="grid-stats">
          <StatCard
            label="Operators"
            value={operators.length}
            icon={<Users size={20} color="#6ee7b7" />}
          />
          <StatCard
            label="Ready"
            value={readyCount}
            icon={<Activity size={20} color="#6ee7b7" />}
          />
          <StatCard
            label="Avg Health"
            value={averageHealth + "%"}
            icon={<Shield size={20} color="#6ee7b7" />}
          />
          <StatCard
            label="Sim Alerts"
            value={alertCount}
            icon={<Zap size={20} color="#fbbf24" />}
          />
        </section>

        <section className="main-grid">
          <div className="card">
            <h2 className="section-title">
              <MapPin size={20} color="#6ee7b7" />
              Live Area Map
            </h2>
            <p className="section-subtitle">
              Units move automatically. Click an operator to inspect status.
            </p>

            <div className="map-controls">
              <button
                className="action primary"
                onClick={() => setRunning(!running)}
              >
                {running ? <Pause size={16} /> : <Play size={16} />}
                {running ? " Pause" : " Run"}
              </button>

              <button className="action" onClick={resetSimulation}>
                <RotateCcw size={16} /> Reset
              </button>

              <select
                className="select"
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
              >
                <option value={1800}>Slow</option>
                <option value={1200}>Normal</option>
                <option value={600}>Fast</option>
              </select>
            </div>

            <div className="map">
              {objectives.map((objective) => (
                <div
                  key={objective.label}
                  className="objective"
                  style={{
                    left: objective.x + "%",
                    top: objective.y + "%"
                  }}
                >
                  <Crosshair size={12} /> {objective.label}
                </div>
              ))}

              {operators.map((operator) => {
                const status = getStatus(operator);

                return (
                  <button
                    key={operator.id}
                    className="unit"
                    style={{
                      left: operator.x + "%",
                      top: operator.y + "%"
                    }}
                    onClick={() => setSelectedId(operator.id)}
                  >
                    <span
                      className={
                        getTeamClass(operator.team) +
                        (operator.id === selectedId ? " selected" : "")
                      }
                    />
                    <span className="unit-label">
                      {operator.id} · {operator.name} · {status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="operator-panel">
            <div className="card">
              <h2 className="section-title">
                <Bot size={20} color="#6ee7b7" />
                TACNET Assistant
              </h2>

              <div className="operator-name">{selected.name}</div>
              <div className="operator-meta">
                {selected.id} · {selected.role} · {selected.team}
              </div>

              <p className="task">
                <strong>Task:</strong> {selected.task}
              </p>

              <span className={getBadgeClass(getStatus(selected))}>
                {getStatus(selected)}
              </span>

              <Meter
                label="Health"
                value={selected.health}
                icon={<Shield size={14} />}
              />
              <Meter
                label="Ammo"
                value={selected.ammo}
                icon={<Crosshair size={14} />}
              />
              <Meter
                label="Battery"
                value={selected.battery}
                icon={<Battery size={14} />}
              />

              <div className="chat-row">
                <input
                  className="input"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      askTacnet();
                    }
                  }}
                  placeholder="Try: sitrep, Ghost status, selected"
                />
                <button className="action primary" onClick={askTacnet}>
                  <Send size={16} />
                </button>
              </div>
            </div>

            <div className="card">
              <span className="badge amber">
                <AlertTriangle size={14} />
                Simulation-only visualization for milsim, airsoft, gaming, or
                training planning.
              </span>
            </div>
          </aside>
        </section>

        <section className="board-grid">
          <div className="card">
            <h2 className="section-title">
              <Users size={20} color="#6ee7b7" />
              Team Board
            </h2>

            <select
              className="select"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option>All</option>
              <option>Ghost</option>
              <option>Hammer</option>
              <option>Raven</option>
            </select>

            <div className="team-list">
              {filteredOperators.map((operator) => (
                <button
                  key={operator.id}
                  className="card team-card"
                  onClick={() => setSelectedId(operator.id)}
                >
                  <div className="team-top">
                    <span className="team-name">
                      {operator.id} · {operator.name}
                    </span>
                    <span className={getBadgeClass(getStatus(operator))}>
                      {getStatus(operator)}
                    </span>
                  </div>

                  <div className="team-meta">
                    {operator.role} · {operator.team}
                  </div>

                  <div className="team-stats">
                    <span>HLT {Math.round(operator.health)}%</span>
                    <span>AMMO {Math.round(operator.ammo)}%</span>
                    <span>BAT {Math.round(operator.battery)}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">
              <Radio size={20} color="#6ee7b7" />
              Live Comms
            </h2>

            {logs.map((log, index) => (
              <div className="log" key={index}>
                <div className="log-top">
                  <span>{log.from}</span>
                  <span>{log.time}</span>
                </div>
                <div className="log-msg">{log.msg}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}