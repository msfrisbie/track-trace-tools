import { TaskType } from "@/consts";
import {
  IContactInfo, IMetrcAddPackageNoteData, IReorderTagsPayload, Task
} from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import { primaryMetrcRequestManager } from "@/modules/metrc-request-manager.module";
import { v4 } from "uuid";
import { getVoidTagBody } from "./tags";

const TASK_TYPES_REQUIRING_FORM_DATA = [
  TaskType.ADD_PACKAGE_NOTE,
  TaskType.VOID_TAGS,
  TaskType.REORDER_TAGS
];

export async function createTask(taskType: TaskType, formData: any = null): Promise<Task> {
  const taskId = v4();
  let taskName = `Task ${taskId}`;
  let body = null;

  if (TASK_TYPES_REQUIRING_FORM_DATA.includes(taskType) && !formData) {
    throw new Error("This request type requires form data");
  }

  switch (taskType) {
    case TaskType.NOOP:
      taskName = `NOOP`;
      break;

    case TaskType.NOOP_NETWORK:
      taskName = `NOOP_NETWORK`;
      break;

    case TaskType.VOID_TAGS:
      if (!formData.tag) {
        throw new Error("This task type requires a tag");
      }

      taskName = `Void ${formData.tag}`;
      body = getVoidTagBody(await primaryDataLoader.lookupTagId(formData.tag));
      break;

    case TaskType.ADD_PACKAGE_NOTE:
      if (!formData.tag) {
        throw new Error("This task type requires a tag");
      }

      if (!formData.note) {
        throw new Error("This task type requires a note");
      }

      taskName = `Add note to ${formData.tag}`;

      const addPackageNotePayload: Array<IMetrcAddPackageNoteData> = [
        // {
        //   Id: await primaryDataLoader.lookupPackageId(formData.tag),
        //   Note: formData.note
        // }
      ];

      body = JSON.stringify(addPackageNotePayload);
      break;

    case TaskType.REORDER_TAGS:
      if (!formData) {
        throw new Error("This task type requires form data");
      }

      const contactInfo = formData.contactInfo as IContactInfo;

      taskName = `Reorder tags`;

      const reorderTagsPayload: IReorderTagsPayload = {
        Details: [
          {
            TagType: "CannabisPlant",
            Quantity: formData.plantTagCount.toString()
          },
          {
            TagType: "CannabisPackage",
            Quantity: formData.packageTagCount.toString()
          }
        ],
        Shipping: {
          ContactName: contactInfo.contactName,
          ContactPhoneNumber: contactInfo.phoneNumber,
          Address: {
            AddressValidationOverridden: "true",
            Street1: contactInfo.address.address1,
            Street2: contactInfo.address.address2,
            City: contactInfo.address.city,
            State: contactInfo.address.state,
            PostalCode: contactInfo.address.zip
          }
        }
      };

      body = JSON.stringify(reorderTagsPayload);
      break;

    default:
      throw new Error("Bad task type");
  }

  const taskData = {
    body
  };

  return {
    taskId,
    taskType,
    taskName,
    taskData
  };
}

export async function runTask(task: Task): Promise<boolean> {
  const authState = await authManager.authStateOrNull();

  if (!authState) {
    // Not logged in, no tasks should be run
    return false;
  }

  try {
    let response;

    switch (task.taskType) {
      case TaskType.NOOP:
        return true;

      case TaskType.NOOP_NETWORK:
        response = await primaryMetrcRequestManager.noop();
        return response.status === 200;

      case TaskType.ADD_PACKAGE_NOTE:
        response = await primaryMetrcRequestManager.addPackageNote(task.taskData.body);
        return response.status === 200;

      case TaskType.VOID_TAGS:
        response = await primaryMetrcRequestManager.voidTag(task.taskData.body);
        return response.status === 200;

      case TaskType.REORDER_TAGS:
        response = await primaryMetrcRequestManager.reorderTags(task.taskData.body);
        return response.status === 200;

      default:
        console.error("Unrecognized task");
        return false;
    }
  } catch (e) {
    console.error("Failed task", e);

    return false;
  }
}
