
import { useEffect, useState } from "react";
import {
  BrainCircuit,
  Sparkles,
  FolderKanban,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  ListChecks,
  RefreshCw,
  Send,
  Loader2,
} from "lucide-react";

import projectService from "../services/projectService";
import aiService from "../services/aiService";

function AIAnalysis() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [question, setQuestion] = useState("");

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const [analysis, setAnalysis] = useState(null);
  const [statistics, setStatistics] = useState(null);

  const [error, setError] = useState("");

  // Load projects
  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      setError("");

      const response = await projectService.getProjects();

      const projectList = Array.isArray(response)
        ? response
        : response?.data || response?.projects || [];

      setProjects(projectList);

      if (projectList.length > 0) {
        setSelectedProject(String(projectList[0].id));
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load projects. Please try again."
      );
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Generate AI analysis
  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (!selectedProject) {
      setError("Please select a project.");
      return;
    }

    try {
      setAnalyzing(true);
      setError("");
      setAnalysis(null);
      setStatistics(null);

      const response = await aiService.analyzeProject(
        selectedProject,
        question
      );

      setAnalysis(response?.data?.analysis || null);
      setStatistics(response?.data?.data_snapshot || null);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "AI analysis failed. Please try again."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityStyle = (severity) => {
    const value = severity?.toLowerCase();

    if (value === "high" || value === "critical") {
      return "border-red-500/20 bg-red-500/10 text-red-400";
    }

    if (value === "medium") {
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";
    }

    return "border-blue-500/20 bg-blue-500/10 text-blue-400";
  };

  const getPriorityStyle = (priority) => {
    const value = priority?.toUpperCase();

    if (value === "HIGH" || value === "URGENT") {
      return "text-red-400";
    }

    if (value === "MEDIUM") {
      return "text-yellow-400";
    }

    return "text-green-400";
  };

  return (
    <div className="min-h-screen space-y-6 bg-dark-main p-4 text-white sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-brand-yellow/10 p-3">
          <BrainCircuit className="h-7 w-7 text-brand-yellow" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">
            AI Project Assistant
          </h1>
          <p className="mt-1 text-sm text-dark-muted">
            Analyze projects and receive AI-powered recommendations.
          </p>
        </div>
      </div>

      {/* Analysis Form */}
      <div className="rounded-2xl border border-dark-border bg-dark-card p-6">
        <div className="mb-5 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-yellow" />
          <h2 className="text-lg font-semibold text-white">
            Generate Project Analysis
          </h2>
        </div>

        <form onSubmit={handleAnalyze} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Select Project
            </label>

            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setAnalysis(null);
                setStatistics(null);
                setError("");
              }}
              disabled={loadingProjects || analyzing}
              className="w-full rounded-lg border border-dark-border bg-dark-elevated px-4 py-3 text-white outline-none focus:border-brand-yellow"
            >
              <option value="">Select a project</option>

              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Ask a Question
            </label>

            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Example: Which tasks are at risk of delay?"
              maxLength={1000}
              rows={3}
              disabled={analyzing}
              className="w-full resize-y rounded-lg border border-dark-border bg-dark-elevated px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-brand-yellow"
            />

            <p className="mt-1 text-right text-xs text-dark-muted">
              {question.length}/1000
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              loadingProjects ||
              analyzing ||
              !selectedProject ||
              projects.length === 0
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-yellow px-5 py-3 font-semibold text-black transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing Project...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Analyze Project
              </>
            )}
          </button>
        </form>

        {loadingProjects && (
          <p className="mt-4 text-sm text-dark-muted">
            Loading projects...
          </p>
        )}

        {!loadingProjects && projects.length === 0 && !error && (
          <p className="mt-4 text-sm text-dark-muted">
            No projects are available for analysis.
          </p>
        )}
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-2xl border border-dark-border bg-dark-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-brand-yellow" />
              <h2 className="text-lg font-semibold text-white">
                Analysis Results
              </h2>
            </div>

            <h3 className="text-xl font-bold text-brand-yellow">
              {analysis.project_name}
            </h3>

            <p className="mt-3 leading-7 text-gray-300">
              {analysis.summary}
            </p>

            <div className="mt-6 border-t border-dark-border pt-5">
              <h3 className="mb-2 font-semibold text-white">
                Progress Assessment
              </h3>

              <p className="leading-7 text-dark-muted">
                {analysis.progress_assessment}
              </p>
            </div>
          </div>

          {/* Statistics */}
          {statistics && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {[
                {
                  label: "Total Tasks",
                  value: statistics.total_tasks,
                },
                {
                  label: "To Do",
                  value: statistics.todo,
                },
                {
                  label: "In Progress",
                  value: statistics.in_progress,
                },
                {
                  label: "Completed",
                  value: statistics.completed,
                },
                {
                  label: "Overdue",
                  value: statistics.overdue,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-dark-border bg-dark-card p-4"
                >
                  <p className="text-sm text-dark-muted">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-brand-yellow">
                    {item.value ?? 0}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Delay Risks */}
          <div className="rounded-xl border border-dark-border bg-dark-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <h2 className="text-lg font-semibold">
                Delay Risks
              </h2>
            </div>

            {analysis.delay_risks?.length > 0 ? (
              <div className="space-y-3">
                {analysis.delay_risks.map((risk, index) => (
                  <div
                    key={`${risk.task_id}-${index}`}
                    className="rounded-lg border border-dark-border bg-dark-elevated p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-medium text-white">
                        {risk.task_title}
                      </h3>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${getSeverityStyle(
                          risk.severity
                        )}`}
                      >
                        {risk.severity}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-dark-muted">
                      {risk.reason}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      Task ID: {risk.task_id}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-dark-muted">
                No delay risks identified.
              </p>
            )}
          </div>

          {/* Priority Recommendations */}
          <div className="rounded-xl border border-dark-border bg-dark-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-brand-yellow" />
              <h2 className="text-lg font-semibold">
                Priority Recommendations
              </h2>
            </div>

            {analysis.priority_recommendations?.length > 0 ? (
              <div className="space-y-3">
                {analysis.priority_recommendations.map(
                  (recommendation, index) => (
                    <div
                      key={`${recommendation.task_id}-${index}`}
                      className="rounded-lg border border-dark-border bg-dark-elevated p-4"
                    >
                      <h3 className="font-medium text-white">
                        {recommendation.task_title}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-4 text-sm">
                        <span className="text-dark-muted">
                          Current:{" "}
                          <span className={getPriorityStyle(
                            recommendation.current_priority
                          )}>
                            {recommendation.current_priority}
                          </span>
                        </span>

                        <span className="text-dark-muted">
                          Suggested:{" "}
                          <span className={getPriorityStyle(
                            recommendation.suggested_priority
                          )}>
                            {recommendation.suggested_priority}
                          </span>
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-dark-muted">
                        {recommendation.reason}
                      </p>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-dark-muted">
                No priority recommendations available.
              </p>
            )}
          </div>

          {/* Next Steps */}
          <div className="rounded-xl border border-dark-border bg-dark-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-green-400" />
              <h2 className="text-lg font-semibold">
                Recommended Next Steps
              </h2>
            </div>

            {analysis.next_steps?.length > 0 ? (
              <ul className="space-y-3">
                {analysis.next_steps.map((step, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm text-gray-300"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                    {step}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-dark-muted">
                No next steps provided.
              </p>
            )}
          </div>

          {/* Direct Answer */}
          <div className="rounded-xl border border-brand-yellow/20 bg-brand-yellow/5 p-6">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-yellow" />
              <h2 className="font-semibold text-brand-yellow">
                AI Assistant Answer
              </h2>
            </div>

            <p className="whitespace-pre-wrap leading-7 text-gray-300">
              {analysis.answer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIAnalysis;
