import { IsEnum, IsInt, Matches, Max, Min } from "class-validator";
import { WeekDay } from "@vonveria-swim/database";

export class ScheduleRuleDto {
  @IsEnum(WeekDay)
  weekDay!: WeekDay;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "startTime debe tener formato HH:mm" })
  startTime!: string;

  @IsInt()
  @Min(15)
  @Max(240)
  durationMinutes!: number;
}
