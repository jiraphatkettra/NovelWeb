"use client";

import React from "react";
import { useSidePanel } from "@/context/SidePanelContext";
import { IssueReportModal } from "@/components/support/IssueReportModal";

export function GlobalIssueModal() {
  const { isIssueModalOpen, closeIssueModal } = useSidePanel();
  return <IssueReportModal isOpen={isIssueModalOpen} onClose={closeIssueModal} />;
}
