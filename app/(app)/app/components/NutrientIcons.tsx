import React from "react";

export function ProteinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M6 8h12v3a6 6 0 0 1-6 6h0a6 6 0 0 1-6-6V8z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 5h8v3H8z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

export function SugarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 3l7 4v10l-7 4-7-4V7l7-4z" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
    </svg>
  );
}

export function SodiumIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M5 12c4-6 10-6 14 0" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 15c3-3 5-3 8 0" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

export function FatIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 3c5 4 5 10 0 14-5-4-5-10 0-14z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

export function FiberIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M4 12h16M6 8h12M6 16h12" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

export function CalorieIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 2v6l4-2-4 8V12l-4 2 4-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}


