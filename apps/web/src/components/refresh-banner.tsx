export function RefreshBanner({ status }: { readonly status: string }) {
  const ok = status === 'ok';
  const message = ok ? 'ახალი ამბებია ხელმისაწვდომი. განაახლეთ გვერდი.' : errorMessage(status);
  const classes = ok
    ? 'border-(--color-sage) bg-(--color-sage-soft) text-(--color-ink)'
    : 'border-red-400/50 bg-red-500/10 text-red-700 dark:text-red-300';
  return (
    <div role="status" className={`rounded-lg border px-4 py-3 text-sm ${classes}`}>
      {message}
    </div>
  );
}

function errorMessage(status: string): string {
  if (status === 'not-configured') {
    return 'GitHub-ის ინტეგრაცია არ არის კონფიგურირებული';
  }
  if (status === 'unauthorized') {
    return 'ავტორიზაცია ვერ მოხერხდა';
  }
  if (status === 'not-found') {
    return 'სამუშაო პროცესი ვერ მოიძებნა';
  }
  return 'ვერ მოხერხდა';
}
