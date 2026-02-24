import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "next-themes";
import {
  Shield,
  ShieldAlert,
  Globe,
  Lock,
  Unlock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Eye,
  Ban,
  MapPin,
  Server,
  ChevronDown,
  Link2,
  Zap,
} from "lucide-react";

interface LinkPreviewProps {
  url?: string;
  riskScore?: number;
  domainAgeDays?: number | null;
}

interface ThreatIndicator {
  id: string;
  type: "critical" | "warning" | "safe";
  label: string;
  description: string;
}

const LinkPreview: React.FC<LinkPreviewProps> = ({
  url = "https://secure-verify-account.tk/login/microsoft/verify",
  riskScore = 87,
  domainAgeDays,
}) => {
  const [showFullUrl, setShowFullUrl] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const colors = {
    safe: mounted && resolvedTheme === "light" ? "#16A34A" : "#00FFAA",
    warning: mounted && resolvedTheme === "light" ? "#F59E0B" : "#FFA500",
    danger: mounted && resolvedTheme === "light" ? "#DC2626" : "#FF3B3B",
  };

  const domainAge = domainAgeDays != null ? `${domainAgeDays} days` : "Unknown";
  const sslStatus = "Invalid Certificate";
  const sslValid = false;
  const location = "Unknown";
  const registrar = "FreeDomainRegistry.tk";
  const lastScanned = "2 minutes ago";

  const threatIndicators: ThreatIndicator[] = [
    {
      id: "1",
      type: "critical",
      label: "Spoofed Domain",
      description: "Domain mimics legitimate Microsoft services",
    },
    {
      id: "2",
      type: "critical",
      label: "Invalid SSL",
      description: "SSL certificate is self-signed or expired",
    },
    {
      id: "3",
      type: "warning",
      label: "New Domain",
      description: "Domain registered within last 30 days",
    },
    {
      id: "4",
      type: "critical",
      label: "Suspicious TLD",
      description: "Using .tk domain commonly associated with phishing",
    },
    {
      id: "5",
      type: "warning",
      label: "No HTTPS Redirect",
      description: "Site accessible via insecure HTTP protocol",
    },
  ];

  const getRiskColor = (score: number) => {
    if (score >= 70) return { color: colors.danger, label: "High Risk", glow: `${colors.danger}4D` }; // 4D = 30% alpha
    if (score >= 40) return { color: colors.warning, label: "Suspicious", glow: `${colors.warning}4D` };
    return { color: colors.safe, label: "Safe", glow: `${colors.safe}4D` };
  };

  const riskInfo = getRiskColor(riskScore);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-card text-foreground p-6 rounded-2xl shadow-2xl border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="absolute inset-0 blur-lg rounded-full opacity-50"
              style={{ backgroundColor: riskInfo.glow }}
            />
            <Shield className="w-7 h-7 relative z-10" style={{ color: riskInfo.color }} />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Secure Link Analysis
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time threat detection & sandboxed preview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Last scanned:</span>
          <span className="text-xs text-foreground font-medium">{lastScanned}</span>
        </div>
      </div>

      {/* URL Display */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target URL</span>
        </div>
        <div className="bg-muted/50 border border-border rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-4">
              <p
                className={`font-mono text-sm ${
                  showFullUrl ? "break-all" : "truncate"
                } text-foreground/90`}
              >
                {url}
              </p>
            </div>
            <button
              onClick={() => setShowFullUrl(!showFullUrl)}
              className="px-3 py-1 text-xs bg-card hover:bg-muted border border-border rounded-lg transition-colors flex items-center gap-1 flex-shrink-0 text-foreground"
            >
              <Eye className="w-3 h-3" />
              {showFullUrl ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>
      </div>

      {/* Security Info Bar - Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {/* Risk Score Meter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1 bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-5"
            style={{
              background: `radial-gradient(circle at top right, ${riskInfo.color}, transparent)`,
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4" style={{ color: riskInfo.color }} />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Risk Score
              </span>
            </div>
            <div className="flex items-end gap-3">
              <div
                className="text-4xl font-bold"
                style={{ color: riskInfo.color }}
              >
                {riskScore}
              </div>
              <div className="mb-1">
                <div
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: riskInfo.color }}
                >
                  {riskInfo.label}
                </div>
                <div className="text-[10px] text-muted-foreground">out of 100</div>
              </div>
            </div>
            {/* Mini progress bar */}
            <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${riskScore}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${riskInfo.color}, ${riskInfo.glow})`,
                  boxShadow: `0 0 10px ${riskInfo.glow}`,
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Domain Age */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent opacity-50" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-warning" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Domain Age
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-warning">{domainAge}</div>
              <AlertTriangle className="w-5 h-5 text-warning/50" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Registered recently
            </div>
          </div>
        </motion.div>

        {/* SSL Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${sslValid ? 'from-safe/5' : 'from-destructive/5'} to-transparent opacity-50`} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              {sslValid ? (
                <Lock className="w-4 h-4 text-safe" />
              ) : (
                <Unlock className="w-4 h-4 text-destructive" />
              )}
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                SSL Status
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className={`text-sm font-bold ${sslValid ? 'text-safe' : 'text-destructive'}`}>
                {sslStatus}
              </div>
              {sslValid ? (
                <CheckCircle2 className="w-5 h-5 text-safe/50" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive/50" />
              )}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {sslValid ? 'Certificate verified' : 'Security risk detected'}
            </div>
          </div>
        </motion.div>

        {/* Location Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Location
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-primary">{location}</div>
              <Globe className="w-5 h-5 text-primary/50" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Server location masked
            </div>
          </div>
        </motion.div>
      </div>

      {/* Threat Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-4 h-4 text-destructive" />
          <span className="text-sm font-semibold text-foreground/80">Detected Threats</span>
          <span className="ml-auto text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full border border-destructive/20">
            {threatIndicators.filter(t => t.type === 'critical').length} Critical
          </span>
        </div>
        <div className="bg-muted/50 border border-border rounded-xl p-4 backdrop-blur-sm">
          <div className="space-y-2">
            {threatIndicators.map((threat, index) => (
              <motion.div
                key={threat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  threat.type === "critical"
                    ? "bg-destructive/5 border-destructive/20"
                    : threat.type === "warning"
                    ? "bg-warning/5 border-warning/20"
                    : "bg-safe/5 border-safe/20"
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {threat.type === "critical" ? (
                    <XCircle className="w-4 h-4 text-destructive" />
                  ) : threat.type === "warning" ? (
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-safe" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-semibold ${
                      threat.type === "critical"
                        ? "text-destructive"
                        : threat.type === "warning"
                        ? "text-warning"
                        : "text-safe"
                    }`}
                  >
                    {threat.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{threat.description}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Sandboxed Preview Window */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground/80">Sandboxed Preview</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Server className="w-3 h-3" />
            <span>Isolated Environment</span>
          </div>
        </div>
        <div className="bg-muted/50 border-2 border-border rounded-xl overflow-hidden backdrop-blur-sm relative">
          {/* Browser Chrome */}
          <div className="bg-muted border-b border-border px-4 py-2 flex items-center gap-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive/80" />
              <div className="w-3 h-3 rounded-full bg-warning/80" />
              <div className="w-3 h-3 rounded-full bg-safe/80" />
            </div>
            <div className="flex-1 bg-background/50 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <Lock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-mono truncate">{url}</span>
            </div>
          </div>

          {/* Preview Content - Simulated Phishing Page */}
          <div className="relative bg-white p-8 min-h-[400px]">
            {/* Warning Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-destructive/10 via-transparent to-transparent pointer-events-none" />
            
            {/* Simulated Login Form */}
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                  M
                </div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Sign in to your account</h1>
                <p className="text-sm text-gray-600">Enter your credentials to continue</p>
              </div>

              <div className="space-y-4 opacity-50 pointer-events-none">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                    placeholder="user@example.com"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                    placeholder="••••••••"
                    disabled
                  />
                </div>
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium">
                  Sign in
                </button>
              </div>

              {/* Warning Badge Overlay */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                  className="bg-destructive/95 backdrop-blur-md text-destructive-foreground px-6 py-4 rounded-xl shadow-2xl border-2 border-destructive"
                >
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-8 h-8" />
                    <div>
                      <div className="font-bold text-lg">Preview Disabled</div>
                      <div className="text-sm opacity-90">High-risk phishing detected</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Watermark */}
            <div className="absolute bottom-4 right-4 text-xs text-gray-400 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>SpectraShield Protected</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Advanced Details (Expandable) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mb-6"
      >
        <button
          onClick={() => toggleSection("advanced")}
          className="w-full flex items-center justify-between p-4 bg-card hover:bg-muted/50 border border-border rounded-xl transition-colors"
        >
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground/80">Advanced Technical Details</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${
              expandedSection === "advanced" ? "rotate-180" : ""
            }`}
          />
        </button>
        <AnimatePresence>
          {expandedSection === "advanced" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 border border-border border-t-0 rounded-b-xl">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Registrar</div>
                  <div className="text-sm text-foreground/80 font-mono">{registrar}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">TLD Risk</div>
                  <div className="text-sm text-destructive font-semibold">High (.tk)</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">HTTP Status</div>
                  <div className="text-sm text-safe font-mono">200 OK</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Response Time</div>
                  <div className="text-sm text-foreground/80 font-mono">2.3s</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="flex gap-3"
      >
        <button className="flex-1 bg-destructive/10 hover:bg-destructive/20 border-2 border-destructive/30 hover:border-destructive/50 text-destructive px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group">
          <Ban className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          Block & Report
        </button>
        <button className="flex-1 bg-card hover:bg-muted border-2 border-border hover:border-foreground/20 text-foreground/80 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group">
          <ExternalLink className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          Open Anyway (Unsafe)
        </button>
      </motion.div>
    </div>
  );
};

export default LinkPreview;