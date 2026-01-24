"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-border-dark px-10 py-3 bg-white dark:bg-background-dark sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-4">
          <div className="size-8 text-primary">
            <svg
              fill="none"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <g clipPath="url(#clip0_6_535)">
                <path
                  clipRule="evenodd"
                  d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z"
                  fill="currentColor"
                  fillRule="evenodd"
                ></path>
              </g>
              <defs>
                <clipPath id="clip0_6_535">
                  <rect fill="white" height="48" width="48"></rect>
                </clipPath>
              </defs>
            </svg>
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">
            EdgeInsight
          </h2>
        </Link>
        <nav className="flex items-center gap-9">
          <Link
            className="text-sm font-medium leading-normal hover:text-primary transition-colors"
            href="#"
          >
            Dashboard
          </Link>
          <Link
            className="text-sm font-medium leading-normal hover:text-primary transition-colors"
            href="#"
          >
            Audits
          </Link>
          <Link
            className="text-sm font-medium leading-normal hover:text-primary transition-colors"
            href="#"
          >
            Settings
          </Link>
        </nav>
      </div>
      <div className="flex flex-1 justify-end gap-6">
        <label className="flex flex-col min-w-40 !h-10 max-w-64">
          <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
            <div
              className="text-slate-400 flex border-none bg-slate-100 dark:bg-card-dark items-center justify-center pl-4 rounded-l-lg"
              data-icon="MagnifyingGlass"
            >
              <span className="material-symbols-outlined text-[20px]">
                search
              </span>
            </div>
            <input
              className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg focus:outline-0 focus:ring-0 border-none bg-slate-100 dark:bg-card-dark focus:border-none h-full placeholder:text-slate-400 px-4 rounded-l-none pl-2 text-sm font-normal"
              placeholder="Search repositories..."
              defaultValue=""
            />
          </div>
        </label>
        <div className="flex gap-2">
          <button className="flex cursor-pointer items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-card-dark text-slate-600 dark:text-white hover:bg-slate-200 dark:hover:bg-border-dark transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-primary"
            data-alt="User profile avatar"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDDixe9LVIGJ0IdUEjTTKOt2Wwcr5QyTkUNN5RMdbJXhD6OBGOSLSGMe8yi35vIO9iNDuz5IRYsEIr2KLasD9vee5pQHOQ1-TVN-9a7jpT8jih52IxID44N6ov9DM05PhjJEyUADNoRI-Ce_DRsz7jmOcpBwvTezWsGFb7s-PoJaGFessMkxmzvnlmmQlqlIRJoAD9lLADVM4Vn96ar2Un4Df78mj0uUXhoPBGe3K8gf0kYmCysJPOhArYKiBFTUUHwdYmk-4R9rO8D")',
            }}
          ></div>
        </div>
      </div>
    </header>
  );
}
