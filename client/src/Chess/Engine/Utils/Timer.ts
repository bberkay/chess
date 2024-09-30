/**
 * Timer class for handling timer functionality.
 */
export class Timer{
    private remaining: number;
    private expected: number;
    private _isStarted: boolean;
    private _isPaused: boolean;
    private pausedTime: number;
    private readonly increment: number;

    /**
     * Constructor for the Timer class.
     * @param remaining The remaining time in milliseconds.
     * @param increment The increment time in milliseconds.
     */
    constructor(remaining: number, increment: number){
        this.remaining = remaining;
        this.increment = increment;
        this._isStarted = false;
        this._isPaused = false;
        this.expected = -1;
        this.pausedTime = 0;
    }
  
    /**
     * Is the timer started.
     */
    public isStarted(): boolean {
        return this._isStarted;
    }

    /**
     * Is the timer paused.
     */
    public isPaused(): boolean {
        return this._isPaused;
    }
    
    /**
     * Start the timer.
     */
    public start (): void {
        if (this._isStarted && !this._isPaused)
          throw new Error("There is already a timer running. Before starting a new timer, stop the current one.");
      
        this._isStarted = true;
        
        if(this._isPaused){
            this._isPaused = false;
            this.expected += Date.now() - this.pausedTime;
            return;
        }
        
        this.expected = Date.now() + this.remaining;
    }
  
    /**
     * Destroy the timer.
     */
    public destroy(): void {
        if (!this._isStarted)
            return;
    
        this.expected = -1;
        this._isStarted = false;
    }

    /**
     * Increase the remaining time by adding
     * the increment.
     */
    public increase(): void {
        if (!this._isStarted)
            throw new Error("Timer should be started before increasing.");

        this.expected += this.increment;
    }
  
    /**
     * Pause the timer.
     */
    public pause(): void {
        if (!this._isStarted)
            throw new Error("Timer should be started before pausing.");

        if (this._isPaused)
            return;
    
        this._isPaused = true;
        this.pausedTime = Date.now();
    }

    /**
     * Get the remaining time in milliseconds.
     */
    public get(): number {
        if (!this._isStarted || this.expected === -1) 
            return this.remaining;

        if (this._isPaused)
            return this.expected - this.pausedTime;

        return this.expected - Date.now();
    }
}