import { Whiteboard } from "./components/Whiteboard";

export default function WhiteboardPage() {
    return (
        <div className="h-screen w-full">
            <div className="h-full">
                <Whiteboard className="h-full w-full" />
            </div>
        </div>
    );
}
