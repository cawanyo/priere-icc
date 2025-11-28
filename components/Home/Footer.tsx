import React from "react";

export default function Footer() {
  return (
    <footer className="text-center py-4 text-sm  border-t">
      &copy; {new Date().getFullYear()} Prayer Connect. All rights reserved.
    </footer>
  );
}
