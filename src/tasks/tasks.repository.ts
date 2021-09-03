import {
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/auth/user.entity';
import { EntityRepository, Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { TaskStatus } from './task-status.enum';
import { Task } from './task.entity';

@EntityRepository(Task)
export class TasksRepository extends Repository<Task> {
  private logger = new Logger('TasksRepository', { timestamp: true });

  async getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    const { status, search } = filterDto;
    const query = this.createQueryBuilder('task');
    query.where({ user });

    if (status) {
      query.andWhere('task.status = :status', { status });
    }
    if (search) {
      query.andWhere(
        '(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.desc) LIKE LOWER(:search))',
        {
          search: `%${search}%`,
        },
      );
    }
    try {
      const tasks = await query.getMany();
      return tasks;
    } catch (error) {
      this.logger.error(
        `Failed to get tasks for ${user.username}. Filters: ${JSON.stringify(
          filterDto,
        )}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  // async getTaskById(id: string, user: User): Promise<Task> {
  //   const query = this.createQueryBuilder('task');
  //   query.where({ user }).andWhere('task.id = :id', { id });

  //   const task = await query.getOne();

  //   if (!task) {
  //     throw new NotFoundException();
  //   }

  //   return task;
  // }

  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const { title, desc } = createTaskDto;

    const task = this.create({
      title,
      desc,
      status: TaskStatus.OPEN,
      user,
    });

    await this.save(task);
    return task;
  }
}
