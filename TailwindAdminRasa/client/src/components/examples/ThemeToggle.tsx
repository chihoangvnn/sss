import { ThemeToggle } from "../ThemeToggle";

export default function ThemeToggleExample() {
  return (
    <div className="p-6 flex items-center justify-center">
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">Thử chuyển đổi chế độ sáng/tối:</p>
        <ThemeToggle />
      </div>
    </div>
  );
}