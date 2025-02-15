import {Job} from "./job";
import {assert} from "./asserts";
import chalk from "chalk";

export class Validator {

    private static needs(jobs: ReadonlyArray<Job>, stages: readonly string[]) {
        for (const job of jobs) {
            if (job.needs === null || job.needs.length === 0) continue;

            const undefNeed = job.needs.filter((v) => !jobs.some(n => n.baseName === v.job));
            assert(undefNeed.length !== job.needs.length, chalk`needs: [{blueBright ${undefNeed.map(n => n.job).join(",")}}] for {blueBright ${job.name}} cannot be found`);

            for (const need of job.needs) {
                const needJob = jobs.find(j => j.baseName === need.job);
                assert(needJob != null, chalk`needs: [{blueBright ${need.job}}] for {blueBright ${job.baseName}} could not be found`);
                const needJobStageIndex = stages.indexOf(needJob.stage);
                const jobStageIndex = stages.indexOf(job.stage);
                assert(needJobStageIndex <= jobStageIndex, chalk`needs: [{blueBright ${needJob.name}}] for {blueBright ${job.name}} is in a future stage`);
            }

        }
    }

    private static dependencies(jobs: ReadonlyArray<Job>, stages: readonly string[]) {
        for (const job of jobs) {
            if (job.dependencies === null || job.dependencies.length === 0) continue;

            const undefDeps = job.dependencies.filter((j) => !jobs.some(n => n.baseName === j));
            assert(undefDeps.length !== job.dependencies.length, chalk`dependencies: [{blueBright ${undefDeps.join(",")}}] for {blueBright ${job.name}} cannot be found`);

            for (const dep of job.dependencies) {
                const depJob = jobs.find(j => j.baseName === dep);
                assert(depJob != null, chalk`dependencies: [{blueBright ${dep}}] for {blueBright ${job.baseName}} could not be found`);
                const depJobStageIndex = stages.indexOf(depJob.stage);
                const jobStageIndex = stages.indexOf(job.stage);
                assert(depJobStageIndex <= jobStageIndex, chalk`dependencies: [{blueBright ${depJob.name}}] for {blueBright ${job.name}} is in a future stage`);
            }
        }
    }

    private static dependenciesContainment(jobs: ReadonlyArray<Job>) {
        for (const job of jobs) {
            const needs = job.needs;
            const dependencies = job.dependencies;
            if (needs && needs.length === 0) continue;
            if (!dependencies || !needs) continue;


            const everyIncluded = dependencies.every((dep: string) => {
                return needs.some(n => n.job === dep);
            });
            const assertMsg = `${job.chalkJobName} needs: '${needs.map(n => n.job).join(",")}' doesn't fully contain dependencies: '${dependencies.join(",")}'`;
            assert(everyIncluded, assertMsg);
        }
    }

    private static scriptBlank(jobs: ReadonlyArray<Job>) {
        for (const job of jobs) {
            if (job.trigger) continue; // Jobs with trigger are allowed to have empty script
            assert(job.scripts.length > 0, chalk`{blue ${job.name}} has empty script`);
        }
    }

    private static cache(jobs: ReadonlyArray<Job>) {
        for (const job of jobs) {
            job.cache.forEach((c, i) => {
                assert(Array.isArray(c.paths), chalk`{blue ${job.name}} cache[${i}].paths must be array`);
            });
        }
    }

    static async run(jobs: ReadonlyArray<Job>, stages: readonly string[]) {
        this.scriptBlank(jobs);
        this.needs(jobs, stages);
        this.dependencies(jobs, stages);
        this.cache(jobs);
        this.dependenciesContainment(jobs);
    }
}
