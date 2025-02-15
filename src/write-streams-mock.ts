import {WriteStreams} from "./write-streams";

export class WriteStreamsMock implements WriteStreams {

    private currentStderr = "";
    private currentStdout = "";

    readonly stderrLines: string[] = [];
    readonly stdoutLines: string[] = [];

    stderr(txt: string): void {
        this.currentStderr += txt;
        if (txt.endsWith("\n")) {
            this.stderrLines.push(this.currentStderr.slice(0, -1));
            this.currentStderr = "";
        }
    }

    stdout(txt: string): void {
        this.currentStdout += txt;
        if (txt.endsWith("\n")) {
            this.stdoutLines.push(this.currentStdout.slice(0, -1));
            this.currentStdout = "";
        }
    }

    flush(): void {
        if (this.currentStdout.length != 0) {
            this.stdout("\n");
        }
        if (this.currentStderr.length != 0) {
            this.stderr("\n");
        }
    }

}
