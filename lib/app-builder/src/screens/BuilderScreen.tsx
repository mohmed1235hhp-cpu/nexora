import { useState } from "react";
import { APP_TYPES } from "../constants/appTypes";
import { Button } from "../components/buttons/Button";
import { Textarea } from "../components/inputs/Textarea";
import { Select } from "../components/inputs/Select";
import { Field } from "../components/forms/Field";
import { Card } from "../components/cards/Card";
import { CardHeader } from "../components/cards/CardHeader";
import { CardBody } from "../components/cards/CardBody";
import { useBuilder } from "../hooks/useBuilder";
import { usePipeline } from "../hooks/usePipeline";
import { pipelineRunner } from "../services/pipeline/PipelineRunner";
import { uid } from "../utils/id";
import type { AppType } from "../core/types";

export function BuilderScreen() {
  const { request, setDescription, setType } = useBuilder();
  const { setBuildId, reset } = usePipeline();
  const [busy, setBusy] = useState(false);
  const [desc, setDesc] = useState(request?.description ?? "");
  const [type, setLocalType] = useState<AppType>(request?.type ?? "pwa");

  async function onGenerate() {
    setBusy(true); reset();
    setDescription(desc); setType(type);
    const buildId = uid("build");
    setBuildId(buildId);
    try { await pipelineRunner.run(uid("req"), buildId); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold">منشئ التطبيقات</h1>
      <Card>
        <CardHeader><h2 className="font-semibold">صف تطبيقك</h2></CardHeader>
        <CardBody>
          <div className="flex flex-col gap-3">
            <Field label="الوصف"><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="مثال: تطبيق POS لمطعم..." /></Field>
            <Field label="نوع التطبيق">
              <Select value={type} onChange={(e) => setLocalType(e.target.value as AppType)}>
                {APP_TYPES.map((t) => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
              </Select>
            </Field>
            <Button onClick={onGenerate} loading={busy} disabled={!desc.trim()}>🚀 توليد التطبيق</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
